using System.ComponentModel.DataAnnotations.Schema;
namespace LogicLab.Models;
public class Exercise
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Expression { get; set; } = "";
    public string Difficulty { get; set; } = "medium";  // easy/medium/hard
    public string Tags { get; set; } = "[]";             // JSON array
    public string HiddenConfig { get; set; } = "{}";    // JSON: which columns/cells are hidden
    public bool IsPublic { get; set; } = true;
    public int AuthorId { get; set; }
    [ForeignKey("AuthorId")]
    public User Author { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<ExerciseAttempt> Attempts { get; set; } = [];
}
