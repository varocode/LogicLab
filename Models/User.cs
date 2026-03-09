namespace LogicLab.Models;
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "user";
    public int XP { get; set; }
    public int Streak { get; set; }
    public DateTime? LastActivityDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<SavedExpression> SavedExpressions { get; set; } = [];
    public List<Exercise> Exercises { get; set; } = [];
    public List<ExerciseAttempt> Attempts { get; set; } = [];
    public List<UserBadge> Badges { get; set; } = [];
}
