using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LogicLab.Data;
using LogicLab.DTOs;
using LogicLab.Services;

namespace LogicLab.Controllers;
[ApiController][Route("api/leaderboard")]
public class LeaderboardController(AppDbContext db, BadgeService badgeSvc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int limit = 20)
    {
        var users = await db.Users
            .Include(u => u.Attempts)
            .Include(u => u.Badges)
            .OrderByDescending(u => u.XP)
            .Take(limit)
            .ToListAsync();

        var result = users.Select((u, i) => new LeaderboardEntryDto(
            i + 1,
            u.Id,
            u.Username,
            u.XP,
            u.Streak,
            u.Attempts.Count(a => a.Completed),
            BadgeService.All
                .Where(b => u.Badges.Any(ub => ub.BadgeKey == b.Key))
                .Take(3)
                .Select(b => new BadgeDto(b.Key, b.Name, b.Icon, b.Description))
                .ToList()
        ));

        return Ok(result);
    }
}
