using Shop.Application.Common;

namespace Shop.UnitTests.Application;

public class PresentationTests
{
    [Fact]
    public void Hue_is_stable_and_in_range()
    {
        Assert.Equal(Presentation.HueFor("galaxy-phone"), Presentation.HueFor("galaxy-phone"));
        Assert.InRange(Presentation.HueFor("anything"), 0, 359);
    }

    [Theory]
    [InlineData("smartphones", "phone")]
    [InlineData("footwear", "shoe")]
    [InlineData("unknown-category", "dumbbell")]
    public void Glyph_follows_category(string slug, string expected) => Assert.Equal(expected, Presentation.GlyphFor(slug));

    [Theory]
    [InlineData("a@b.co", true)]
    [InlineData("not-an-email", false)]
    [InlineData("", false)]
    public void Email_validation(string value, bool expected) => Assert.Equal(expected, Validation.IsEmail(value));
}
