using API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations;

[DbContext(typeof(MusicPlayerDbContext))]
[Migration("20261010004000_AddImportErrorColumns")]
public partial class AddImportErrorColumns : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            "ALTER TABLE \"ImportJobs\" ADD COLUMN IF NOT EXISTS \"Error\" character varying(1000);");
        migrationBuilder.Sql(
            "ALTER TABLE \"ImportWorkItems\" ADD COLUMN IF NOT EXISTS \"Error\" text;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally left empty. The columns are part of the current model
        // and may have existed before this repair migration was introduced.
    }
}
