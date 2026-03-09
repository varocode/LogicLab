using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using LogicLab.Data;
using LogicLab.DTOs;
using LogicLab.Models;

namespace LogicLab.Services;
public class AuthService(AppDbContext db, IConfiguration cfg)
{
    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        if (await db.Users.AnyAsync(u => u.Email == dto.Email)) return null;
        if (await db.Users.AnyAsync(u => u.Username == dto.Username)) return null;
        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return BuildResponse(user);
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash)) return null;
        return BuildResponse(user);
    }

    private AuthResponseDto BuildResponse(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("username", user.Username)
        };
        var token = new JwtSecurityToken(cfg["Jwt:Issuer"], cfg["Jwt:Audience"],
            claims, expires: DateTime.UtcNow.AddDays(7), signingCredentials: creds);
        return new(new JwtSecurityTokenHandler().WriteToken(token),
            user.Id, user.Username, user.Email, user.Role, user.XP, user.Streak);
    }
}
