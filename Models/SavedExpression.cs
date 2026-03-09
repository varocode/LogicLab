namespace LogicLab.Models;
public class SavedExpression
{
    public int Id { get; set; }
    public string Input { get; set; } = "";
    public string Name { get; set; } = "";
    public string Variables { get; set; } = "[]";      // JSON array of variable names
    public string TruthTable { get; set; } = "{}";     // JSON truth table result
    public string Classification { get; set; } = "";   // tautology/contradiction/contingency
    public bool IsPublic { get; set; }
    public string ShareId { get; set; } = "";
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
