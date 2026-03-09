using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LogicLab.DTOs;
using LogicLab.Services;

namespace LogicLab.Controllers;
[ApiController][Route("api/badges")]
public class BadgesController(BadgeService svc) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("all")]
    public IActionResult GetAll()
        => Ok(BadgeService.All.Select(b => new BadgeDto(b.Key, b.Name, b.Icon, b.Description)));

    [HttpGet("mine"), Authorize]
    public async Task<IActionResult> GetMine()
    {
        var list = await svc.GetUserBadgesAsync(UserId);
        return Ok(list.Select(b => new BadgeDto(b.Key, b.Name, b.Icon, b.Description)));
    }

    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetForUser(int userId)
    {
        var list = await svc.GetUserBadgesAsync(userId);
        return Ok(list.Select(b => new BadgeDto(b.Key, b.Name, b.Icon, b.Description)));
    }
}
