using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class DataBaseTableV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AccessToken_Users_UserID",
                table: "AccessToken");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AccessToken",
                table: "AccessToken");

            migrationBuilder.RenameTable(
                name: "AccessToken",
                newName: "AccessTokens");

            migrationBuilder.RenameIndex(
                name: "IX_AccessToken_UserID",
                table: "AccessTokens",
                newName: "IX_AccessTokens_UserID");

            migrationBuilder.RenameIndex(
                name: "IX_AccessToken_jti",
                table: "AccessTokens",
                newName: "IX_AccessTokens_jti");

            migrationBuilder.AlterColumn<string>(
                name: "Jti",
                table: "Users",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "AccessTokens",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddPrimaryKey(
                name: "PK_AccessTokens",
                table: "AccessTokens",
                column: "ID");

            migrationBuilder.AddForeignKey(
                name: "FK_AccessTokens_Users_UserID",
                table: "AccessTokens",
                column: "UserID",
                principalTable: "Users",
                principalColumn: "ID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AccessTokens_Users_UserID",
                table: "AccessTokens");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AccessTokens",
                table: "AccessTokens");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "AccessTokens");

            migrationBuilder.RenameTable(
                name: "AccessTokens",
                newName: "AccessToken");

            migrationBuilder.RenameIndex(
                name: "IX_AccessTokens_UserID",
                table: "AccessToken",
                newName: "IX_AccessToken_UserID");

            migrationBuilder.RenameIndex(
                name: "IX_AccessTokens_jti",
                table: "AccessToken",
                newName: "IX_AccessToken_jti");

            migrationBuilder.AlterColumn<string>(
                name: "Jti",
                table: "Users",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AccessToken",
                table: "AccessToken",
                column: "ID");

            migrationBuilder.AddForeignKey(
                name: "FK_AccessToken_Users_UserID",
                table: "AccessToken",
                column: "UserID",
                principalTable: "Users",
                principalColumn: "ID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
