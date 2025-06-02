const bcrypt = require('bcryptjs');
import * as jwt from 'jsonwebtoken';
import { dataSource } from '../../db/connection';
import { user } from '../userModule/userEntity';
import { promises } from 'dns';

export async function generateJwt(userData: user) {

    const token = jwt.sign(
        { userData },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
    );

    return token;
}

