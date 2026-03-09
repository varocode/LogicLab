using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LogicLab.Data;
using LogicLab.DTOs;

namespace LogicLab.Controllers;
[ApiController][Route("api/users")]
public class UsersController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("me"), Authorize]
    public async Task<IActionResult> GetMe()
    {
        var user = await db.Users.FindAsync(UserId);
        if (user is null) return NotFound();
        return Ok(new UserProfileDto(user.Id, user.Username, user.Email, user.Role, user.XP, user.Streak, user.CreatedAt));
    }

    [HttpPut("me"), Authorize]
    public async Task<IActionResult> UpdateMe(UpdateProfileDto dto)
    {
        var user = await db.Users.FindAsync(UserId);
        if (user is null) return NotFound();
        if (!string.IsNullOrEmpty(dto.Username))
        {
            if (await db.Users.AnyAsync(u => u.Username == dto.Username && u.Id != UserId))
                return BadRequest(new { message = "Nombre de usuario ya en uso" });
            user.Username = dto.Username;
        }
        await db.SaveChangesAsync();
        return Ok(new UserProfileDto(user.Id, user.Username, user.Email, user.Role, user.XP, user.Streak, user.CreatedAt));
    }
}
