<?php

namespace Olympus\Db;

use PDO;
use PDOException;

class Connection
{
    private static ?PDO $instance = null;

    public static function get(): PDO
    {
        if (self::$instance === null) {
            $dsn = getenv('DATABASE_URL') ?: ($_ENV['DATABASE_URL'] ?? 'postgresql://olympus:olympus_secret@db:5432/olympus_db');

            // Parse URL if needed or use straight DSN if format matches libpq
            // Standard PDO PGSQL DSN: pgsql:host=localhost;port=5432;dbname=testdb;user=bruce;password=mypass

            // Allow manual env override or parse from DATABASE_URL
            $dbUrl = parse_url($dsn);

            $host = $dbUrl['host'] ?? 'db';
            $port = $dbUrl['port'] ?? 5432;
            $db = ltrim($dbUrl['path'] ?? '/olympus_db', '/');
            $user = $dbUrl['user'] ?? 'olympus';
            $pass = $dbUrl['pass'] ?? 'olympus_secret';

            $dsnString = "pgsql:host=$host;port=$port;dbname=$db";

            try {
                self::$instance = new PDO($dsnString, $user, $pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (PDOException $e) {
                // In production, log this, don't show it.
                // For this project, we might want to see it if it fails.
                throw new \Exception("Database Connection Error: " . $e->getMessage());
            }
        }

        return self::$instance;
    }
}
