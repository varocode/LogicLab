using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LogicLab.DTOs;
using LogicLab.Services;

namespace LogicLab.Controllers;
[ApiController][Route("api/exercises")]
public class ExercisesController(ExerciseService svc) : ControllerBase
{
    private int UserId => User.Identity?.IsAuthenticated == true
        ? int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!) : 0;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? difficulty, [FromQuery] string? search,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 12)
        => Ok(await svc.GetAllAsync(difficulty, search, page, pageSize));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await svc.GetByIdAsync(id, UserId);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpGet("mine"), Authorize]
    public async Task<IActionResult> GetMine()
        => Ok(await svc.GetMyExercisesAsync(UserId));

    [HttpPost, Authorize]
    public async Task<IActionResult> Create(CreateExerciseDto dto)
    {
        var r = await svc.CreateAsync(UserId, dto);
        return r is null ? BadRequest(new { message = "Expresión inválida" }) : Ok(r);
    }

    [HttpPost("{id:int}/attempt"), Authorize]
    public async Task<IActionResult> Submit(int id, SubmitAttemptDto dto)
    {
        var r = await svc.SubmitAttemptAsync(UserId, id, dto);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpGet("{id:int}/hint/{column}"), Authorize]
    public async Task<IActionResult> GetHint(int id, string column)
    {
        var r = await svc.GetHintAsync(id, column, UserId);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpDelete("{id:int}"), Authorize]
    public async Task<IActionResult> Delete(int id)
        => await svc.DeleteAsync(id, UserId) ? NoContent() : NotFound();
}
