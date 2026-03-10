using System.Text;
using System.Text.RegularExpressions;

namespace LogicLab.Services;

// ─── AST Nodes ───────────────────────────────────────────────────────────────
public abstract record ExprNode
{
    public abstract string ToDisplay();
}
public record VarNode(string Name) : ExprNode
{
    public override string ToDisplay() => Name;
}
public record NotNode(ExprNode Operand) : ExprNode
{
    public override string ToDisplay() => $"¬{Operand.ToDisplay()}";
}
public record BinNode(string Op, ExprNode Left, ExprNode Right) : ExprNode
{
    public override string ToDisplay() => $"({Left.ToDisplay()} {OpSymbol(Op)} {Right.ToDisplay()})";
    private static string OpSymbol(string op) => op switch
    {
        "AND" => "∧", "OR" => "∨", "XOR" => "⊕",
        "NAND" => "↑", "NOR" => "↓",
        "IMP" => "→", "BICON" => "↔", _ => op
    };
}

// ─── Token ───────────────────────────────────────────────────────────────────
public enum TokKind { Var, Not, And, Or, Xor, Nand, Nor, Imp, Bicon, LParen, RParen, EOF }
public record Token(TokKind Kind, string Raw);

// ─── Results ─────────────────────────────────────────────────────────────────
public record TruthTableResult(
    List<string> Variables,
    List<string> SubExpressions,   // ordered sub-expressions to display as columns
    List<Dictionary<string, bool>> Rows,
    string Classification
);

public record AnalysisResult(bool AreEquivalent, string? CounterExample);
public record ConsequenceResult(bool IsConsequence, string? CounterExample);

public record KMapCell(int Row, int Col, bool Value, string Minterm);
public record KMapResult(int VarCount, List<string> RowHeaders, List<string> ColHeaders, List<KMapCell> Cells, string Expression, List<string> Groups);

public record QMResult(string Simplified, List<string> PrimeImplicants, List<string> Steps);

// ─── Logic Engine ────────────────────────────────────────────────────────────
public class LogicEngine
{
    // ── Public API ──────────────────────────────────────────────────────────

    public TruthTableResult GenerateTruthTable(string input)
    {
        var node = Parse(Normalize(input));
        var vars = ExtractVars(node).OrderBy(v => v).ToList();
        var subExprs = ExtractSubExpressions(node, vars);
        var rows = new List<Dictionary<string, bool>>();
        int n = vars.Count;

        for (int i = (1 << n) - 1; i >= 0; i--)
        {
            var assignment = new Dictionary<string, bool>();
            for (int j = 0; j < n; j++)
                assignment[vars[j]] = ((i >> (n - 1 - j)) & 1) == 1;

            var row = new Dictionary<string, bool>(assignment);
            foreach (var (expr, subNode) in subExprs)
                row[expr] = Evaluate(subNode, assignment);
            rows.Add(row);
        }

        bool allTrue = rows.All(r => r[subExprs[^1].Key]);
        bool allFalse = rows.All(r => !r[subExprs[^1].Key]);
        string classification = allTrue ? "tautology" : allFalse ? "contradiction" : "contingency";

        return new TruthTableResult(vars, subExprs.Select(s => s.Key).ToList(), rows, classification);
    }

    public AnalysisResult CheckEquivalence(string expr1, string expr2)
    {
        var n1 = Parse(Normalize(expr1));
        var n2 = Parse(Normalize(expr2));
        var vars = ExtractVars(n1).Union(ExtractVars(n2)).OrderBy(v => v).ToList();
        int count = vars.Count;

        for (int i = 0; i < (1 << count); i++)
        {
            var asgn = BuildAssignment(vars, i);
            if (Evaluate(n1, asgn) != Evaluate(n2, asgn))
                return new(false, FormatAssignment(asgn));
        }
        return new(true, null);
    }

    public ConsequenceResult CheckConsequence(List<string> premises, string conclusion)
    {
        var nodes = premises.Select(p => Parse(Normalize(p))).ToList();
        var concNode = Parse(Normalize(conclusion));
        var vars = nodes.SelectMany(ExtractVars).Union(ExtractVars(concNode)).OrderBy(v => v).ToList();

        for (int i = 0; i < (1 << vars.Count); i++)
        {
            var asgn = BuildAssignment(vars, i);
            if (nodes.All(n => Evaluate(n, asgn)) && !Evaluate(concNode, asgn))
                return new(false, FormatAssignment(asgn));
        }
        return new(true, null);
    }

    public bool IsSatisfiable(string input)
    {
        var node = Parse(Normalize(input));
        var vars = ExtractVars(node).OrderBy(v => v).ToList();
        for (int i = 0; i < (1 << vars.Count); i++)
            if (Evaluate(node, BuildAssignment(vars, i))) return true;
        return false;
    }

    public string ToCNF(string input)
    {
        var node = Parse(Normalize(input));
        var vars = ExtractVars(node).OrderBy(v => v).ToList();
        var falseMinterms = new List<int>();
        for (int i = 0; i < (1 << vars.Count); i++)
            if (!Evaluate(node, BuildAssignment(vars, i))) falseMinterms.Add(i);

        if (!falseMinterms.Any()) return input + " (tautología — no hay forma CNF no trivial)";
        var clauses = falseMinterms.Select(m =>
        {
            var asgn = BuildAssignment(vars, m);
            var literals = vars.Select(v => asgn[v] ? $"¬{v}" : v);
            return "(" + string.Join(" ∨ ", literals) + ")";
        });
        return string.Join(" ∧ ", clauses);
    }

    public string ToDNF(string input)
    {
        var node = Parse(Normalize(input));
        var vars = ExtractVars(node).OrderBy(v => v).ToList();
        var trueMinterms = new List<int>();
        for (int i = 0; i < (1 << vars.Count); i++)
            if (Evaluate(node, BuildAssignment(vars, i))) trueMinterms.Add(i);

        if (!trueMinterms.Any()) return input + " (contradicción — no hay forma DNF no trivial)";
        var terms = trueMinterms.Select(m =>
        {
            var asgn = BuildAssignment(vars, m);
            var literals = vars.Select(v => asgn[v] ? v : $"¬{v}");
            return "(" + string.Join(" ∧ ", literals) + ")";
        });
        return string.Join(" ∨ ", terms);
    }

    public KMapResult GetKMap(string input)
    {
        var node = Parse(Normalize(input));
        var vars = ExtractVars(node).OrderBy(v => v).ToList();
        if (vars.Count < 2 || vars.Count > 4)
            throw new InvalidOperationException("K-Map requires 2-4 variables");

        // Gray code ordering
        int[] gray2 = [0, 1, 3, 2];
        string[] labels2 = ["00", "01", "11", "10"];
        string[] labels1 = ["0", "1"];

        List<string> rowHeaders, colHeaders;
        List<KMapCell> cells = [];

        if (vars.Count == 2)
        {
            // 1 row var, 1 col var
            rowHeaders = [$"{vars[0]}=0", $"{vars[0]}=1"];
            colHeaders = [$"{vars[1]}=0", $"{vars[1]}=1"];
            for (int r = 0; r < 2; r++)
                for (int c = 0; c < 2; c++)
                {
                    var asgn = new Dictionary<string, bool> { [vars[0]] = r == 1, [vars[1]] = c == 1 };
                    var minterm = $"m{(r << 1 | c)}";
                    cells.Add(new(r, c, Evaluate(node, asgn), minterm));
                }
        }
        else if (vars.Count == 3)
        {
            rowHeaders = [$"{vars[0]}=0", $"{vars[0]}=1"];
            colHeaders = labels2.Select((l, i) => $"{vars[1]}{vars[2]}={l}").ToList();
            for (int r = 0; r < 2; r++)
                for (int c = 0; c < 4; c++)
                {
                    int gc = gray2[c];
                    var asgn = new Dictionary<string, bool>
                    {
                        [vars[0]] = r == 1,
                        [vars[1]] = ((gc >> 1) & 1) == 1,
                        [vars[2]] = (gc & 1) == 1
                    };
                    int idx = (r << 2) | gc;
                    cells.Add(new(r, c, Evaluate(node, asgn), $"m{idx}"));
                }
        }
        else // 4 variables
        {
            rowHeaders = labels2.Select((l, i) => $"{vars[0]}{vars[1]}={l}").ToList();
            colHeaders = labels2.Select((l, i) => $"{vars[2]}{vars[3]}={l}").ToList();
            for (int r = 0; r < 4; r++)
                for (int c = 0; c < 4; c++)
                {
                    int gr = gray2[r]; int gc = gray2[c];
                    var asgn = new Dictionary<string, bool>
                    {
                        [vars[0]] = ((gr >> 1) & 1) == 1,
                        [vars[1]] = (gr & 1) == 1,
                        [vars[2]] = ((gc >> 1) & 1) == 1,
                        [vars[3]] = (gc & 1) == 1
                    };
                    int idx = (gr << 2) | gc;
                    cells.Add(new(r, c, Evaluate(node, asgn), $"m{idx}"));
                }
        }
        return new(vars.Count, rowHeaders, colHeaders, cells, input, []);
    }

    public QMResult Simplify(string input)
    {
        var node = Parse(Normalize(input));
        var vars = ExtractVars(node).OrderBy(v => v).ToList();
        int n = vars.Count;
        var minterms = new List<int>();
        for (int i = 0; i < (1 << n); i++)
            if (Evaluate(node, BuildAssignment(vars, i))) minterms.Add(i);

        if (!minterms.Any()) return new("0 (Contradicción)", [], []);
        if (minterms.Count == (1 << n)) return new("1 (Tautología)", [], []);

        var steps = new List<string>();
        var primes = RunQM(minterms, n, vars, steps);
        var essential = FindEssential(primes, minterms, vars, steps);
        return new(essential, primes, steps);
    }

    // ── Parser ──────────────────────────────────────────────────────────────

    public ExprNode Parse(string input)
    {
        var tokens = Tokenize(input);
        int pos = 0;
        var result = ParseBicon(tokens, ref pos);
        if (pos < tokens.Count && tokens[pos].Kind != TokKind.EOF)
            throw new Exception($"Token inesperado: '{tokens[pos].Raw}'");
        return result;
    }

    private string Normalize(string input)
    {
        // Replace unicode and text operators with canonical forms
        input = input
            .Replace("↔", " BICON ")
            .Replace("<->", " BICON ")
            .Replace("<=>", " BICON ")
            .Replace("IFF", " BICON ")
            .Replace("→", " IMP ")
            .Replace("->", " IMP ")
            .Replace("=>", " IMP ")
            .Replace("IMPLIES", " IMP ")
            .Replace("↓", " NOR ")
            .Replace("↑", " NAND ")
            .Replace("⊕", " XOR ")
            .Replace("∨", " OR ")
            .Replace("∧", " AND ")
            .Replace("¬", " NOT ")
            .Replace("~", " NOT ")
            .Replace("!", " NOT ")
            .Replace("&&", " AND ")
            .Replace("||", " OR ")
            .Replace("^", " XOR ")
            .Replace("&", " AND ")
            .Replace("|", " OR ");
        return input;
    }

    private List<Token> Tokenize(string input)
    {
        var tokens = new List<Token>();
        int i = 0;
        input = input.Trim();
        while (i < input.Length)
        {
            if (char.IsWhiteSpace(input[i])) { i++; continue; }
            if (input[i] == '(') { tokens.Add(new(TokKind.LParen, "(")); i++; continue; }
            if (input[i] == ')') { tokens.Add(new(TokKind.RParen, ")")); i++; continue; }
            if (char.IsLetter(input[i]))
            {
                var sb = new StringBuilder();
                while (i < input.Length && char.IsLetterOrDigit(input[i])) sb.Append(input[i++]);
                var word = sb.ToString().ToUpper();
                tokens.Add(word switch
                {
                    "NOT" => new(TokKind.Not, word),
                    "AND" => new(TokKind.And, word),
                    "OR" => new(TokKind.Or, word),
                    "XOR" => new(TokKind.Xor, word),
                    "NAND" => new(TokKind.Nand, word),
                    "NOR" => new(TokKind.Nor, word),
                    "IMP" => new(TokKind.Imp, word),
                    "BICON" => new(TokKind.Bicon, word),
                    _ => new(TokKind.Var, word)
                });
                continue;
            }
            throw new Exception($"Carácter no reconocido: '{input[i]}'");
        }
        tokens.Add(new(TokKind.EOF, ""));
        return tokens;
    }

    private ExprNode ParseBicon(List<Token> t, ref int pos)
    {
        var left = ParseImp(t, ref pos);
        while (pos < t.Count && t[pos].Kind == TokKind.Bicon)
        {
            pos++;
            var right = ParseImp(t, ref pos);
            left = new BinNode("BICON", left, right);
        }
        return left;
    }

    private ExprNode ParseImp(List<Token> t, ref int pos)
    {
        var left = ParseNor(t, ref pos);
        if (pos < t.Count && t[pos].Kind == TokKind.Imp)
        {
            pos++;
            var right = ParseImp(t, ref pos); // right-associative
            return new BinNode("IMP", left, right);
        }
        return left;
    }

    private ExprNode ParseNor(List<Token> t, ref int pos)
    {
        var left = ParseOr(t, ref pos);
        while (pos < t.Count && t[pos].Kind == TokKind.Nor)
        {
            pos++;
            var right = ParseOr(t, ref pos);
            left = new BinNode("NOR", left, right);
        }
        return left;
    }

    private ExprNode ParseOr(List<Token> t, ref int pos)
    {
        var left = ParseXor(t, ref pos);
        while (pos < t.Count && t[pos].Kind == TokKind.Or)
        {
            pos++;
            var right = ParseXor(t, ref pos);
            left = new BinNode("OR", left, right);
        }
        return left;
    }

    private ExprNode ParseXor(List<Token> t, ref int pos)
    {
        var left = ParseNand(t, ref pos);
        while (pos < t.Count && t[pos].Kind == TokKind.Xor)
        {
            pos++;
            var right = ParseNand(t, ref pos);
            left = new BinNode("XOR", left, right);
        }
        return left;
    }

    private ExprNode ParseNand(List<Token> t, ref int pos)
    {
        var left = ParseAnd(t, ref pos);
        while (pos < t.Count && t[pos].Kind == TokKind.Nand)
        {
            pos++;
            var right = ParseAnd(t, ref pos);
            left = new BinNode("NAND", left, right);
        }
        return left;
    }

    private ExprNode ParseAnd(List<Token> t, ref int pos)
    {
        var left = ParseNot(t, ref pos);
        while (pos < t.Count && t[pos].Kind == TokKind.And)
        {
            pos++;
            var right = ParseNot(t, ref pos);
            left = new BinNode("AND", left, right);
        }
        return left;
    }

    private ExprNode ParseNot(List<Token> t, ref int pos)
    {
        if (pos < t.Count && t[pos].Kind == TokKind.Not)
        {
            pos++;
            return new NotNode(ParseNot(t, ref pos));
        }
        return ParseAtom(t, ref pos);
    }

    private ExprNode ParseAtom(List<Token> t, ref int pos)
    {
        if (pos >= t.Count) throw new Exception("Expresión incompleta");
        if (t[pos].Kind == TokKind.LParen)
        {
            pos++;
            var inner = ParseBicon(t, ref pos);
            if (pos >= t.Count || t[pos].Kind != TokKind.RParen)
                throw new Exception("Falta paréntesis de cierre ')'");
            pos++;
            return inner;
        }
        if (t[pos].Kind == TokKind.Var)
        {
            var name = t[pos].Raw;
            pos++;
            return new VarNode(name);
        }
        throw new Exception($"Se esperaba variable o '(', se encontró '{t[pos].Raw}'");
    }

    // ── Evaluation ──────────────────────────────────────────────────────────

    public bool Evaluate(ExprNode node, Dictionary<string, bool> values) => node switch
    {
        VarNode v => values.TryGetValue(v.Name, out var val) ? val : throw new Exception($"Variable '{v.Name}' no definida"),
        NotNode n => !Evaluate(n.Operand, values),
        BinNode b => b.Op switch
        {
            "AND" => Evaluate(b.Left, values) && Evaluate(b.Right, values),
            "OR" => Evaluate(b.Left, values) || Evaluate(b.Right, values),
            "XOR" => Evaluate(b.Left, values) ^ Evaluate(b.Right, values),
            "NAND" => !(Evaluate(b.Left, values) && Evaluate(b.Right, values)),
            "NOR" => !(Evaluate(b.Left, values) || Evaluate(b.Right, values)),
            "IMP" => !Evaluate(b.Left, values) || Evaluate(b.Right, values),
            "BICON" => Evaluate(b.Left, values) == Evaluate(b.Right, values),
            _ => throw new Exception($"Operador desconocido: {b.Op}")
        },
        _ => throw new Exception("Nodo desconocido")
    };

    // ── Sub-expression extraction ────────────────────────────────────────────

    private List<KeyValuePair<string, ExprNode>> ExtractSubExpressions(ExprNode root, List<string> vars)
    {
        var result = new List<KeyValuePair<string, ExprNode>>();
        var seen = new HashSet<string>();
        CollectSubExpressions(root, vars, result, seen);
        return result;
    }

    private void CollectSubExpressions(ExprNode node, List<string> vars,
        List<KeyValuePair<string, ExprNode>> result, HashSet<string> seen)
    {
        if (node is VarNode) return; // vars already shown separately

        // First recurse into children
        if (node is NotNode nn) CollectSubExpressions(nn.Operand, vars, result, seen);
        if (node is BinNode bn)
        {
            CollectSubExpressions(bn.Left, vars, result, seen);
            CollectSubExpressions(bn.Right, vars, result, seen);
        }

        // Then add this node
        var display = node.ToDisplay();
        if (!seen.Contains(display) && !vars.Contains(display))
        {
            seen.Add(display);
            result.Add(new(display, node));
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private HashSet<string> ExtractVars(ExprNode node) => node switch
    {
        VarNode v => [v.Name],
        NotNode n => ExtractVars(n.Operand),
        BinNode b => [.. ExtractVars(b.Left), .. ExtractVars(b.Right)],
        _ => []
    };

    private Dictionary<string, bool> BuildAssignment(List<string> vars, int index)
    {
        var d = new Dictionary<string, bool>();
        for (int j = 0; j < vars.Count; j++)
            d[vars[j]] = ((index >> (vars.Count - 1 - j)) & 1) == 1;
        return d;
    }

    private string FormatAssignment(Dictionary<string, bool> asgn)
        => string.Join(", ", asgn.Select(kv => $"{kv.Key}={kv.Value}"));

    // ── Quine-McCluskey ─────────────────────────────────────────────────────

    private List<string> RunQM(List<int> minterms, int n, List<string> vars, List<string> steps)
    {
        // Represent implicants as (bits, dontcare_mask)
        var current = minterms.Select(m => (bits: m, mask: 0)).ToList();
        steps.Add($"Mintérminos: {string.Join(", ", minterms.Select(m => $"m{m}({ToBin(m, n)})"))}");
        var primes = new List<(int bits, int mask)>();

        while (current.Count > 0)
        {
            var combined = new HashSet<int>();
            var next = new List<(int bits, int mask)>();
            for (int i = 0; i < current.Count; i++)
                for (int j = i + 1; j < current.Count; j++)
                {
                    var (b1, m1) = current[i];
                    var (b2, m2) = current[j];
                    if (m1 != m2) continue;
                    int diff = b1 ^ b2;
                    if (diff != 0 && (diff & (diff - 1)) == 0) // exactly one bit differs
                    {
                        combined.Add(i); combined.Add(j);
                        var newMask = m1 | diff;
                        if (!next.Any(x => x.bits == (b1 & ~diff) && x.mask == newMask))
                            next.Add((b1 & ~diff, newMask));
                    }
                }
            for (int i = 0; i < current.Count; i++)
                if (!combined.Contains(i)) primes.Add(current[i]);
            current = next;
        }

        steps.Add($"Implicantes primos: {primes.Count}");
        return primes.Select(p => ToImplicant(p.bits, p.mask, n, vars)).ToList();
    }

    private string FindEssential(List<string> primes, List<int> minterms, List<string> vars, List<string> steps)
    {
        if (!primes.Any()) return "0";
        steps.Add($"Expresión simplificada: {string.Join(" ∨ ", primes)}");
        return string.Join(" ∨ ", primes);
    }

    private string ToBin(int val, int n)
    {
        var sb = new StringBuilder();
        for (int i = n - 1; i >= 0; i--) sb.Append((val >> i) & 1);
        return sb.ToString();
    }

    private string ToImplicant(int bits, int mask, int n, List<string> vars)
    {
        var literals = new List<string>();
        for (int i = 0; i < n; i++)
        {
            int bitPos = n - 1 - i;
            if ((mask & (1 << bitPos)) != 0) continue; // don't-care position
            if ((bits & (1 << bitPos)) != 0) literals.Add(vars[i]);
            else literals.Add($"¬{vars[i]}");
        }
        return literals.Count == 0 ? "1" : string.Join(" ∧ ", literals);
    }

    // ── Expression Tree ─────────────────────────────────────────────────────

    public object GetExpressionTree(string input)
    {
        var node = Parse(Normalize(input));
        return BuildTree(node);
    }

    private object BuildTree(ExprNode node) => node switch
    {
        VarNode v => new { type = "var", label = v.Name, children = Array.Empty<object>() },
        NotNode n => new { type = "not", label = "¬", children = new[] { BuildTree(n.Operand) } },
        BinNode b => new
        {
            type = "bin",
            label = b.Op switch
            {
                "AND" => "∧", "OR" => "∨", "XOR" => "⊕",
                "NAND" => "↑", "NOR" => "↓", "IMP" => "→", "BICON" => "↔", _ => b.Op
            },
            children = new[] { BuildTree(b.Left), BuildTree(b.Right) }
        },
        _ => new { type = "unknown", label = "?", children = Array.Empty<object>() }
    };

    // ── Validation ──────────────────────────────────────────────────────────

    public (bool valid, string error) Validate(string input)
    {
        try { Parse(Normalize(input)); return (true, ""); }
        catch (Exception ex) { return (false, ex.Message); }
    }
}
