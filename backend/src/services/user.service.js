import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class UserService {
    async registerUser(email, password, username, role) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
console.log("Registering user with email:", email, "and username:", username);  

console.log("Checking if user already exists with email:", email, "or username:", username);    

            // Check if user already exists
            const [existingUsers] = await connection.query(
                'SELECT id FROM auth_users WHERE email = ? OR (username = ? AND username IS NOT NULL)',
                [email, username]
            );

            if (existingUsers.length > 0) {
                throw new Error('User with this email or username already exists');
         }

            // Hash password
            const salt = await bcrypt.genSalt(10);

           
            const passwordHash = await bcrypt.hash(password, salt);

            // Create user

            const userId = uuidv4();

           
            await connection.query(
                'INSERT INTO auth_users (id, email, password_hash, username) VALUES (?, ?, ?, ?)',
                [userId, email, passwordHash, username]
            );

            // Create empty user profile
            await connection.query(
                'INSERT INTO auth_user_profile (user_id) VALUES (?)',
                [userId]
            );

            
                 // Get role ID
            const [roles] = await connection.query(
                'SELECT id FROM auth_roles WHERE name = ?',
                [role]
            );

          

            const roleId = roles[0].id;


            
            // Add role to user
     
 // Insert the new role
        await connection.query(
            'INSERT INTO auth_users_roles (user_id, role_id) VALUES (?, ?)',
            [userId, roleId]
        );
           
            await connection.commit();
             console.log("commiting the transaction of registering user")
            return userId;
        } catch (error) {
            console.log("hey dude that didnt work  , Techaven is rolling back")
            await connection.rollback();
            throw error;
        } finally {
            console.log("done")
            connection.release();
        }
    }

    async loginUser(email, password) {
        try {
            // Get user with roles
            const [users] = await pool.query(`
                SELECT u.*, GROUP_CONCAT(r.name) as roles
                FROM auth_users u
                LEFT JOIN auth_users_roles ur ON u.id = ur.user_id
                LEFT JOIN auth_roles r ON ur.role_id = r.id
                WHERE u.email = ?
                GROUP BY u.id
            `, [email]);

            if (users[0].length === 0) {
                throw new Error('Invalid credentials');
            }

            const user = users[0];

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                throw new Error('Invalid credentials');
            }

            // Create token
            const token = jwt.sign(
                { 
                    id: user.id,
                    email: user.email,
                    roles: user.roles ? user.roles.split(',') : []
                },
                process.env.JWT_SECRET || 'your_jwt_secret_key',
                { expiresIn: '24h' }
            );

            // Don't send password hash to client
            delete user.password_hash;

            return { token, user };
        } catch (error) {
            throw error;
        }
    }

    async getUserById(userId) {
        console.log("user id in user contro ",userId)
        try {
            const [users] = await pool.query(`
                SELECT *
                FROM auth_users
                WHERE id = ?
            `, [userId]);

              console.log("user id in user contro ",users)

            if (users[0].length === 0) return null;

            const user = users[0];
            delete user.password_hash;
            user.roles = user.roles ? user.roles.split(',') : [];

            return user;
        } catch (error) {
            throw new Error('Failed to fetch user');
        }
    }

   async getAllUsers() {
        console.log("Fetching all users");
        try {
            const [users] = await pool.query(`
                SELECT u.*, 
                       GROUP_CONCAT(DISTINCT r.name) as roles,
                       up.full_name, up.phone, up.dob, up.locale
                FROM auth_users u
                LEFT JOIN auth_users_roles ur ON u.id = ur.user_id
                LEFT JOIN auth_roles r ON ur.role_id = r.id
                LEFT JOIN auth_user_profile up ON u.id = up.user_id
                GROUP BY u.id
            `, []);

        

           

            return users;
        } catch (error) {
            throw new Error('Failed to fetch user');
        }
    }

    async updateUserProfile(userId, data) {
        try {
            const [result] = await pool.query(`
                UPDATE auth_user_profile
                SET full_name = COALESCE(?, full_name),
                    phone = COALESCE(?, phone),
                    locale = COALESCE(?, locale)
                WHERE user_id = ?
            `, [
                data.full_name,
                data.phone,
                data.locale,
                userId
            ]);

            return true;
        } catch (error) {
            throw new Error('Failed to update user profile');
        }
    }

    async changePassword(userId, oldPassword, newPassword) {
        try {
            // Get current password hash
            const [users] = await pool.query(
                'SELECT password_hash FROM auth_users WHERE id = ?',
                [userId]
            );

            if (users[0].length === 0) {
                throw new Error('User not found');
            }

            // Verify old password
            const isValidPassword = await bcrypt.compare(oldPassword, users[0].password_hash);
            if (!isValidPassword) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const newPasswordHash = await bcrypt.hash(newPassword, salt);

            // Update password
            await pool.query(
                'UPDATE auth_users SET password_hash = ? WHERE id = ?',
                [newPasswordHash, userId]
            );

            return true;
        } catch (error) {
            throw error;
        }
    }

    async addUserRole(userId, roleName) {
        const connection = await pool.getConnection();
      
        try {
            await connection.beginTransaction();

          
            // Get role ID
            const [roles] = await connection.query(
                'SELECT id FROM auth_roles WHERE name = ?',
                [roleName]
            );

            if (roles[0].length === 0) {
              
                throw new Error('Role not found');
            }
            

            const roleId = roles[0].id;


            
            // Add role to user
     
 // Insert the new role
        await connection.query(
            'INSERT INTO auth_users_roles (user_id, role_id) VALUES (?, ?)',
            [userId, roleId]
        );
          
         

            await connection.commit();
               console.log("Techaven didi it ");
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

export default new UserService();