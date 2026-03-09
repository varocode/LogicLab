using Microsoft.AspNetCore.Mvc;
using LogicLab.DTOs;
using LogicLab.Services;

namespace LogicLab.Controllers;
[ApiController][Route("api/auth")]
public class AuthController(AuthService auth) : ControllerBase
{
    [HttpPost("register")] public async Task<IActionResult> Register(RegisterDto dto)
    { var r = await auth.RegisterAsync(dto); return r is null ? BadRequest(new { message = "Email o nombre de usuario ya en uso" }) : Ok(r); }

    [HttpPost("login")] public async Task<IActionResult> Login(LoginDto dto)
    { var r = await auth.LoginAsync(dto); return r is null ? Unauthorized(new { message = "Credenciales inválidas" }) : Ok(r); }
}
