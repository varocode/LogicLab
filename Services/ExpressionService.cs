using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using LogicLab.Data;
using LogicLab.DTOs;
using LogicLab.Models;

namespace LogicLab.Services;
public class ExpressionService(AppDbContext db, LogicEngine engine)
{
    public async Task<SavedExpressionDto> SaveAsync(int userId, SaveExpressionDto dto)
    {
        var table = engine.GenerateTruthTable(dto.Input);
        var expr = new SavedExpression
        {
            Input = dto.Input,
            Name = dto.Name ?? dto.Input,
            Variables = JsonSerializer.Serialize(table.Variables),
            TruthTable = JsonSerializer.Serialize(table),
            Classification = table.Classification,
            IsPublic = dto.IsPublic,
            ShareId = dto.IsPublic ? Guid.NewGuid().ToString("N")[..8] : "",
            UserId = userId
        };
        db.SavedExpressions.Add(expr);
        await db.SaveChangesAsync();
        return ToDto(expr);
    }

    public async Task<List<SavedExpressionDto>> GetMyExpressionsAsync(int userId)
        => await db.SavedExpressions.Where(e => e.UserId == userId)
            .OrderByDescending(e => e.CreatedAt).Select(e => ToDto(e)).ToListAsync();

    public async Task<SavedExpressionDto?> GetByShareIdAsync(string shareId)
    {
        var expr = await db.SavedExpressions.FirstOrDefaultAsync(e => e.ShareId == shareId && e.IsPublic);
        return expr is null ? null : ToDto(expr);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var expr = await db.SavedExpressions.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
        if (expr is null) return false;
        db.SavedExpressions.Remove(expr);
        await db.SaveChangesAsync();
        return true;
    }

    private static SavedExpressionDto ToDto(SavedExpression e) => new(
        e.Id, e.Input, e.Name, e.Classification, e.IsPublic, e.ShareId, e.CreatedAt);
}
