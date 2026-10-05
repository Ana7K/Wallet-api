import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// decides whether an endpoint requires a valid JWT to be present in the Authorization header to be accessed
export class JwtGuard extends AuthGuard('jwt') {}
