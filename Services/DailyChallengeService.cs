using Microsoft.EntityFrameworkCore;
using LogicLab.Data;
using LogicLab.DTOs;

namespace LogicLab.Services;

public class DailyChallengeService(AppDbContext db)
{
    public async Task<ExerciseListDto?> GetTodayAsync()
    {
        var exercises = await db.Exercises
            .Include(e => e.Author)
            .Include(e => e.Attempts)
            .Where(e => e.IsPublic)
            .ToListAsync();

        if (!exercises.Any()) return null;

        // Deterministic pick based on day of year
        var idx = DateTime.UtcNow.DayOfYear % exercises.Count;
        var ex = exercises[idx];

        return new ExerciseListDto(
            ex.Id, ex.Title, ex.Description, ex.Difficulty,
            ex.Author.Username, ex.Attempts.Count,
            ex.Attempts.Any() ? (int)ex.Attempts.Average(a => a.Score) : 0,
            ex.CreatedAt);
    }
}
