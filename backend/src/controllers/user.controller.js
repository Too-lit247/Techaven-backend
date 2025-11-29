import userService from '../services/user.service.js';

class UserController {
    async register(req, res) {
        try {

            console.log('Registering user with data:', req.body);   



            const { email, password, username, role } = req.body;
            const userId = await userService.registerUser(email, password, username, role);
            res.status(201).json({
                success: true,
                data: {
                    id: userId,
                    message: 'User registered successfully'
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Registration failed'
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            console.log("attempting login with credetins", req.body)
            const { token, user } = await userService.loginUser(email, password);
            res.json({
                success: true,
                data: { token, user }
            });
            console.log("user login", user)
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message || 'Login failed'
            });
        }
    }

     async getAllUsers(req, res) {
        try {
            
            const users = await userService.getAllUsers();
            if (!users) {
                return res.status(404).json({
                    success: false,
                    message: 'Users not found'
                });
            }
            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch users'
            });
        }
    }
async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await userService.getUserById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch profile'
            });
        }
    }


    async getUserById(req, res) {
        try {
            console.log("requesting user with id ", req.body.id)
            const userId = req.body.id;
            const user = await userService.getUserById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch user'
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.body.user_id;
            console.log("user to be updated ",userId)
            await userService.updateUserProfile(userId, req.body);
            res.json({
                success: true,
                message: 'Profile updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update profile'
            });
        }
    }

    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;
            await userService.changePassword(userId, currentPassword, newPassword);
            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to change password'
            });
        }
    }

    async addRole(req, res) {
        try {
            const { userId, role } = req.body;
            await userService.addUserRole(userId, role);
            res.json({
                success: true,
                message: 'Role added successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add role'
            });
        }
    }
}

export default new UserController();