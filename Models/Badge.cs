namespace LogicLab.Models;
public class UserBadge
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string BadgeKey { get; set; } = "";   // e.g. "first_tautology"
    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
}
