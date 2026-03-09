using Microsoft.EntityFrameworkCore;
using LogicLab.Models;

namespace LogicLab.Data;
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<SavedExpression> SavedExpressions => Set<SavedExpression>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<ExerciseAttempt> ExerciseAttempts => Set<ExerciseAttempt>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<User>().HasIndex(u => u.Email).IsUnique();
        mb.Entity<User>().HasIndex(u => u.Username).IsUnique();
        mb.Entity<SavedExpression>().HasIndex(e => e.ShareId).IsUnique().HasFilter("\"ShareId\" != ''");
    }
}
