package db

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func InitDB() error {
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		// Provide a default for local development if not set
		dbUrl = "postgres://user:password@localhost:5432/msgtext_db?sslmode=disable"
		fmt.Println("DATABASE_URL not set, using default:", dbUrl)
	}

	var err error
	Pool, err = pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		return fmt.Errorf("unable to create connection pool: %w", err)
	}

	err = Pool.Ping(context.Background())
	if err != nil {
		Pool.Close() // Close pool if ping fails
		return fmt.Errorf("unable to ping database: %w", err)
	}

	fmt.Println("Successfully connected to PostgreSQL!")
	// Optionally, run migrations here or provide a separate migration tool
	// err = runMigrations()
	// if err != nil {
	//     return fmt.Errorf("failed to run migrations: %w", err)
	// }

	return nil
}

// Placeholder for a migration runner function
// func runMigrations() error {
//  // Read migration files from migrations directory and execute them
//  // This is a simplified example. In a real app, use a migration library.
// 	fmt.Println("Running migrations...")
// 	// Example: read src/backend/migrations/001_init_schema.sql and execute it
// 	migrationFile := "migrations/001_init_schema.sql" // Adjust path as needed
// 	query, err := os.ReadFile(migrationFile)
// 	if err != nil {
// 		return fmt.Errorf("could not read migration file %s: %w", migrationFile, err)
// 	}
//
// 	_, err = Pool.Exec(context.Background(), string(query))
// 	if err != nil {
// 		return fmt.Errorf("error executing migration file %s: %w", migrationFile, err)
// 	}
// 	fmt.Println("Migrations completed.")
// 	return nil
// }

func CloseDB() {
	if Pool != nil {
		Pool.Close()
		fmt.Println("Database connection pool closed.")
	}
}
