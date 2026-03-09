using Microsoft.EntityFrameworkCore;
using LogicLab.Data;
using LogicLab.Models;

namespace LogicLab.Services;

public record BadgeDef(string Key, string Name, string Icon, string Description);

public class BadgeService(AppDbContext db)
{
    public static readonly List<BadgeDef> All =
    [
        new("first_eval",        "Primera evaluación",     "⚡", "Evaluaste tu primera expresión"),
        new("first_tautology",   "Tautólogo",              "✓",  "Encontraste tu primera tautología"),
        new("first_contradiction","Contradictor",           "✗",  "Encontraste tu primera contradicción"),
        new("first_save",        "Guardado",               "💾", "Guardaste tu primera expresión"),
        new("first_exercise",    "Primer ejercicio",       "✏️", "Completaste tu primer ejercicio"),
        new("perfect_score",     "Perfección",             "💯", "Obtuviste 100% en un ejercicio"),
        new("exercise_creator",  "Creador",                "🎨", "Creaste tu primer ejercicio"),
        new("streak_3",          "En racha",               "🔥", "3 días consecutivos de actividad"),
        new("streak_7",          "Imparable",              "🔥🔥","7 días consecutivos de actividad"),
        new("xp_100",            "Centurión",              "⚡", "Alcanzaste 100 XP"),
        new("xp_500",            "Veterano",               "🏆", "Alcanzaste 500 XP"),
        new("de_morgan",         "De Morgan",              "🧮", "Evaluaste la ley de De Morgan"),
        new("explorer",          "Explorador",             "🗺️", "Usaste el K-Map por primera vez"),
        new("analyst",           "Analista",               "🔍", "Usaste el verificador de equivalencia"),
        new("daily_challenge",   "Desafío diario",         "📅", "Completaste un desafío diario"),
        new("exercises_5",       "Practicante",            "✏️✏️","Completaste 5 ejercicios"),
        new("exercises_20",      "Experto",                "🎓", "Completaste 20 ejercicios"),
        new("share",             "Compartidor",            "🔗", "Compartiste una expresión"),
    ];

    public async Task<List<BadgeDef>> CheckAndAwardAsync(int userId, string trigger, object? context = null)
    {
        var user = await db.Users
            .Include(u => u.Badges)
            .Include(u => u.Attempts)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return [];

        var earned = user.Badges.Select(b => b.BadgeKey).ToHashSet();
        var newBadges = new List<BadgeDef>();

        async Task Award(string key)
        {
            if (earned.Contains(key)) return;
            var def = All.FirstOrDefault(b => b.Key == key);
            if (def is null) return;
            db.UserBadges.Add(new UserBadge { UserId = userId, BadgeKey = key });
            earned.Add(key);
            newBadges.Add(def);
        }

        switch (trigger)
        {
            case "eval":
                await Award("first_eval");
                if (context is string cls)
                {
                    if (cls == "tautology") await Award("first_tautology");
                    if (cls == "contradiction") await Award("first_contradiction");
                    if (cls == "tautology" && context?.ToString()?.Contains("morgan") == true) await Award("de_morgan");
                }
                break;
            case "save":
                await Award("first_save");
                await Award("share");
                break;
            case "share":
                await Award("share");
                break;
            case "exercise_complete":
                await Award("first_exercise");
                if (context is int score && score == 100) await Award("perfect_score");
                var totalAttempts = user.Attempts.Count(a => a.Completed);
                if (totalAttempts >= 5)  await Award("exercises_5");
                if (totalAttempts >= 20) await Award("exercises_20");
                break;
            case "exercise_create":
                await Award("exercise_creator");
                break;
            case "streak":
                if (user.Streak >= 3) await Award("streak_3");
                if (user.Streak >= 7) await Award("streak_7");
                break;
            case "xp":
                if (user.XP >= 100) await Award("xp_100");
                if (user.XP >= 500) await Award("xp_500");
                break;
            case "kmap":
                await Award("explorer");
                break;
            case "equivalence":
                await Award("analyst");
                break;
            case "daily":
                await Award("daily_challenge");
                break;
        }

        if (newBadges.Any()) await db.SaveChangesAsync();
        return newBadges;
    }

    public async Task<List<BadgeDef>> GetUserBadgesAsync(int userId)
    {
        var keys = await db.UserBadges.Where(b => b.UserId == userId).Select(b => b.BadgeKey).ToListAsync();
        return All.Where(b => keys.Contains(b.Key)).ToList();
    }
}
