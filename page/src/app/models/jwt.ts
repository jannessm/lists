import { User } from "./user";

export interface JWT {
    iat: string;
    iss: string;
    nbf: number;
    exp: number;
    user: User;
}

export enum COOKIE {
    CONSENT_POPUP = "consent-popup",
    ACCEPTED = "accepted",
    JWT = "jwt"
}