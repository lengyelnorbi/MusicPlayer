export class RefreshToken {
    id!: number;
    tokenHash!: string;
    deviceFingerprint!: string;
    ipAddress!: string;
    expiresAt!: string;
    createdAt!: string;
    isRevoked!: boolean;

    userID!: number;
    username? : string; // Opcionális mező a felhasználónevek tárolására
    role? : string; // UserRole Opcionális mező a felhasználói szerepkörök tárolására
    email? : string; // User Email Opcionális mező a felhasználói email címek tárolására
}