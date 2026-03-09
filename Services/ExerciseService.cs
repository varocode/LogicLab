using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using LogicLab.Data;
using LogicLab.DTOs;
using LogicLab.Models;

namespace LogicLab.Services;
public class ExerciseService(AppDbContext db, LogicEngine engine)
{
    public async Task<ExerciseDto?> CreateAsync(int userId, CreateExerciseDto dto)
    {
        // Validate expression
        var (valid, error) = engine.Validate(dto.Expression);
        if (!valid) return null;

        var exercise = new Exercise
        {
            Title = dto.Title,
            Description = dto.Description,
            Expression = dto.Expression,
            Difficulty = dto.Difficulty,
            Tags = JsonSerializer.Serialize(dto.Tags ?? []),
            HiddenConfig = JsonSerializer.Serialize(dto.HiddenConfig),
            IsPublic = dto.IsPublic,
            AuthorId = userId
        };
        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();
        return await ToDto(exercise, userId);
    }

    public async Task<List<ExerciseListDto>> GetAllAsync(string? difficulty, string? search, int page, int pageSize)
    {
        var q = db.Exercises.Include(e => e.Author)
            .Include(e => e.Attempts)
            .Where(e => e.IsPublic)
            .AsQueryable();
        if (!string.IsNullOrEmpty(difficulty)) q = q.Where(e => e.Difficulty == difficulty);
        if (!string.IsNullOrEmpty(search)) q = q.Where(e => e.Title.Contains(search) || e.Description.Contains(search));
        return await q.OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(e => new ExerciseListDto(
                e.Id, e.Title, e.Description, e.Difficulty,
                e.Author.Username, e.Attempts.Count,
                e.Attempts.Any() ? (int)e.Attempts.Average(a => a.Score) : 0,
                e.CreatedAt))
            .ToListAsync();
    }

    public async Task<ExerciseDto?> GetByIdAsync(int id, int userId)
    {
        var ex = await db.Exercises.Include(e => e.Author).FirstOrDefaultAsync(e => e.Id == id);
        return ex is null ? null : await ToDto(ex, userId);
    }

    public async Task<List<ExerciseDto>> GetMyExercisesAsync(int userId)
    {
        var list = await db.Exercises.Include(e => e.Author)
            .Where(e => e.AuthorId == userId)
            .OrderByDescending(e => e.CreatedAt).ToListAsync();
        var result = new List<ExerciseDto>();
        foreach (var e in list) result.Add(await ToDto(e, userId));
        return result;
    }

    public async Task<AttemptResultDto?> SubmitAttemptAsync(int userId, int exerciseId, SubmitAttemptDto dto)
    {
        var exercise = await db.Exercises.FindAsync(exerciseId);
        if (exercise is null) return null;

        // Generate correct table to validate
        var table = engine.GenerateTruthTable(exercise.Expression);
        var hiddenConfig = JsonSerializer.Deserialize<HiddenConfig>(exercise.HiddenConfig) ?? new();

        int total = 0, correct = 0;
        foreach (var answer in dto.Answers)
        {
            total++;
            int rowIdx = answer.Row;
            string colKey = answer.Column;
            if (rowIdx >= 0 && rowIdx < table.Rows.Count && table.Rows[rowIdx].ContainsKey(colKey))
            {
                if (table.Rows[rowIdx][colKey] == answer.Value) correct++;
            }
        }

        int score = total > 0 ? (correct * 100 / total) : 0;
        var attempt = new ExerciseAttempt
        {
            UserId = userId, ExerciseId = exerciseId,
            Score = score, TotalCells = total, CorrectCells = correct,
            Completed = score == 100, TimeSpentSeconds = dto.TimeSpentSeconds
        };
        db.ExerciseAttempts.Add(attempt);

        // Update user XP and streak
        var user = await db.Users.FindAsync(userId);
        if (user != null)
        {
            user.XP += score / 10;
            var today = DateTime.UtcNow.Date;
            if (user.LastActivityDate?.Date == today.AddDays(-1)) user.Streak++;
            else if (user.LastActivityDate?.Date != today) user.Streak = 1;
            user.LastActivityDate = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return new(score, total, correct, attempt.Id);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var ex = await db.Exercises.FirstOrDefaultAsync(e => e.Id == id && e.AuthorId == userId);
        if (ex is null) return false;
        db.Exercises.Remove(ex);
        await db.SaveChangesAsync();
        return true;
    }

    private async Task<ExerciseDto> ToDto(Exercise e, int userId)
    {
        var bestAttempt = userId > 0
            ? await db.ExerciseAttempts
                .Where(a => a.UserId == userId && a.ExerciseId == e.Id)
                .OrderByDescending(a => a.Score).FirstOrDefaultAsync()
            : null;
        var tags = JsonSerializer.Deserialize<List<string>>(e.Tags) ?? [];
        return new(e.Id, e.Title, e.Description, e.Expression, e.Difficulty, tags,
            e.HiddenConfig, e.IsPublic, e.Author?.Username ?? "", e.CreatedAt,
            bestAttempt?.Score, bestAttempt?.Completed ?? false);
    }
}

public class HiddenConfig
{
    public List<string> HiddenColumns { get; set; } = [];
    public List<HiddenCell> HiddenCells { get; set; } = [];
}
public class HiddenCell { public int Row { get; set; } public string Column { get; set; } = ""; }
