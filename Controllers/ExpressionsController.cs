using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LogicLab.DTOs;
using LogicLab.Services;

namespace LogicLab.Controllers;
[ApiController][Route("api/expressions")]
public class ExpressionsController(ExpressionService svc) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost, Authorize]
    public async Task<IActionResult> Save(SaveExpressionDto dto)
        => Ok(await svc.SaveAsync(UserId, dto));

    [HttpGet("mine"), Authorize]
    public async Task<IActionResult> GetMine()
        => Ok(await svc.GetMyExpressionsAsync(UserId));

    [HttpGet("share/{shareId}")]
    public async Task<IActionResult> GetByShareId(string shareId)
    {
        var r = await svc.GetByShareIdAsync(shareId);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpDelete("{id:int}"), Authorize]
    public async Task<IActionResult> Delete(int id)
        => await svc.DeleteAsync(id, UserId) ? NoContent() : NotFound();
}
