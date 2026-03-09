using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LogicLab.DTOs;
using LogicLab.Services;

namespace LogicLab.Controllers;
[ApiController][Route("api/logic")]
public class LogicController(LogicEngine engine) : ControllerBase
{
    [HttpPost("evaluate")]
    public IActionResult Evaluate([FromBody] EvaluateDto dto)
    {
        try
        {
            var result = engine.GenerateTruthTable(dto.Expression);
            return Ok(result);
        }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("validate")]
    public IActionResult Validate([FromBody] EvaluateDto dto)
    {
        var (valid, error) = engine.Validate(dto.Expression);
        return Ok(new { valid, error });
    }

    [HttpPost("equivalence")]
    public IActionResult Equivalence([FromBody] EquivalenceDto dto)
    {
        try { return Ok(engine.CheckEquivalence(dto.Expr1, dto.Expr2)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("consequence")]
    public IActionResult Consequence([FromBody] ConsequenceDto dto)
    {
        try { return Ok(engine.CheckConsequence(dto.Premises, dto.Conclusion)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("satisfiability")]
    public IActionResult Satisfiability([FromBody] EvaluateDto dto)
    {
        try { return Ok(new { isSatisfiable = engine.IsSatisfiable(dto.Expression) }); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("cnf")]
    public IActionResult ToCNF([FromBody] EvaluateDto dto)
    {
        try { return Ok(new { result = engine.ToCNF(dto.Expression) }); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("dnf")]
    public IActionResult ToDNF([FromBody] EvaluateDto dto)
    {
        try { return Ok(new { result = engine.ToDNF(dto.Expression) }); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("kmap")]
    public IActionResult KMap([FromBody] EvaluateDto dto)
    {
        try { return Ok(engine.GetKMap(dto.Expression)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("simplify")]
    public IActionResult Simplify([FromBody] EvaluateDto dto)
    {
        try { return Ok(engine.Simplify(dto.Expression)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("tree")]
    public IActionResult Tree([FromBody] EvaluateDto dto)
    {
        try { return Ok(engine.GetExpressionTree(dto.Expression)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
