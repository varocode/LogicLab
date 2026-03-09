namespace LogicLab.Models;
public class ExerciseAttempt
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;
    public int Score { get; set; }         // 0-100
    public int TotalCells { get; set; }
    public int CorrectCells { get; set; }
    public bool Completed { get; set; }
    public int TimeSpentSeconds { get; set; }
    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;
}
