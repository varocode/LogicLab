namespace LogicLab.DTOs;

// Auth
public record RegisterDto(string Username, string Email, string Password);
public record LoginDto(string Email, string Password);
public record AuthResponseDto(string Token, int Id, string Username, string Email, string Role, int XP, int Streak);

// Expressions
public record SaveExpressionDto(string Input, string? Name, bool IsPublic);
public record SavedExpressionDto(int Id, string Input, string Name, string Classification, bool IsPublic, string ShareId, DateTime CreatedAt);

// Logic analysis
public record EvaluateDto(string Expression);
public record EquivalenceDto(string Expr1, string Expr2);
public record ConsequenceDto(List<string> Premises, string Conclusion);

// Exercises
public record CreateExerciseDto(
    string Title, string Description, string Expression,
    string Difficulty, List<string>? Tags,
    object HiddenConfig, bool IsPublic);

public record ExerciseListDto(
    int Id, string Title, string Description, string Difficulty,
    string Author, int AttemptCount, int AvgScore, DateTime CreatedAt);

public record ExerciseDto(
    int Id, string Title, string Description, string Expression,
    string Difficulty, List<string> Tags, string HiddenConfig,
    bool IsPublic, string Author, DateTime CreatedAt,
    int? BestScore, bool Completed);

public record SubmitAnswerDto(int Row, string Column, bool Value);
public record SubmitAttemptDto(List<SubmitAnswerDto> Answers, int TimeSpentSeconds);
public record AttemptResultDto(int Score, int Total, int Correct, int AttemptId, List<BadgeDto> NewBadges);
public record HintResultDto(string Column, List<bool> Values);

// Badges
public record BadgeDto(string Key, string Name, string Icon, string Description);

// Leaderboard
public record LeaderboardEntryDto(int Rank, int UserId, string Username, int XP, int Streak, int ExercisesCompleted, List<BadgeDto> TopBadges);

// Profile
public record UserProfileDto(int Id, string Username, string Email, string Role, int XP, int Streak, DateTime CreatedAt);
public record UpdateProfileDto(string? Username);
