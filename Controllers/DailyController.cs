using Microsoft.AspNetCore.Mvc;
using LogicLab.Services;

namespace LogicLab.Controllers;
[ApiController][Route("api/daily")]
public class DailyController(DailyChallengeService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var challenge = await svc.GetTodayAsync();
        if (challenge is null) return NotFound(new { message = "No hay ejercicios disponibles aún" });
        return Ok(new { exercise = challenge, date = DateTime.UtcNow.Date.ToString("yyyy-MM-dd") });
    }
}
