using Microsoft.AspNetCore.Identity;

namespace Shop.Infrastructure.Identity;

public class ApplicationRole : IdentityRole<Guid>
{
    public ApplicationRole()
    {
        Id = Guid.NewGuid();
    }

    public ApplicationRole(string roleName) : this()
    {
        Name = roleName;
    }
}
