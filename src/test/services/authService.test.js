import { describe, it, expect, vi, beforeEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import apiClient from '../../services/apiClient'
import authService from '../../services/authService'

describe('authService', () => {
    let mock

    beforeEach(() => {
        mock = new MockAdapter(apiClient)
        vi.clearAllMocks()
    })

    afterEach(() => {
        mock.restore()
    })

    describe('login', () => {
        it('should login successfully', async () => {
            const credentials = { username: 'test', password: 'password' }
            const responseData = {
                token: 'test-token',
                id: 1,
                username: 'test',
                email: 'test@example.com',
                role: 'Patient'
            }

            mock.onPost('/auth/login').reply(200, responseData)

            const result = await authService.login(credentials)

            expect(result).toEqual({
                success: true,
                token: 'test-token',
                id: 1,
                username: 'test',
                email: 'test@example.com',
                role: 'Patient'
            })
        })

        it('should handle login failure', async () => {
            const credentials = { username: 'test', password: 'wrong' }

            mock.onPost('/auth/login').reply(401, { message: 'Invalid credentials' })

            const result = await authService.login(credentials)

            expect(result).toEqual({
                success: false,
                message: 'Invalid credentials'
            })
        })

        it('should handle network errors', async () => {
            const credentials = { username: 'test', password: 'password' }

            mock.onPost('/auth/login').networkError()

            const result = await authService.login(credentials)

            expect(result).toEqual({
                success: false,
                message: 'Login failed'
            })
        })
    })

    describe('register', () => {
        it('should register successfully', async () => {
            const userData = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'password',
                firstName: 'John',
                lastName: 'Doe'
            }

            mock.onPost('/auth/register').reply(200, { message: 'Registration successful' })

            const result = await authService.register(userData)

            expect(result).toEqual({
                success: true,
                message: 'Registration successful'
            })
        })

        it('should handle registration failure', async () => {
            const userData = {
                username: 'existinguser',
                email: 'existing@example.com',
                password: 'password'
            }

            mock.onPost('/auth/register').reply(400, { message: 'Username already exists' })

            const result = await authService.register(userData)

            expect(result).toEqual({
                success: false,
                message: 'Username already exists'
            })
        })
    })

    describe('getUserProfile', () => {
        it('should get user profile successfully', async () => {
            const profileData = {
                id: 1,
                username: 'test',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'Patient'
            }

            mock.onGet('/auth/me').reply(200, profileData)

            const result = await authService.getUserProfile()

            expect(result).toEqual({
                ...profileData,
                phoneNumber: '',
                dateOfBirth: '',
                address: '',
                profileImageBase64: ''
            })
        })

        it('should handle missing profile fields', async () => {
            const profileData = {
                id: 1,
                username: 'test',
                email: 'test@example.com'
            }

            mock.onGet('/auth/me').reply(200, profileData)

            const result = await authService.getUserProfile()

            expect(result.firstName).toBe('')
            expect(result.lastName).toBe('')
            expect(result.role).toBe('Patient')
        })

        it('should handle profile fetch error', async () => {
            mock.onGet('/auth/me').reply(401, { message: 'Unauthorized' })

            await expect(authService.getUserProfile()).rejects.toThrow('Failed to load user profile')
        })
    })

    describe('updateProfile', () => {
        it('should update profile successfully', async () => {
            const profileData = {
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '123-456-7890'
            }

            mock.onPut('/auth/profile').reply(200, { message: 'Profile updated' })

            const result = await authService.updateProfile(profileData)

            expect(result).toEqual({
                success: true,
                data: { message: 'Profile updated' }
            })
        })

        it('should handle update failure', async () => {
            const profileData = { firstName: 'John' }

            mock.onPut('/auth/profile').reply(400, { message: 'Invalid data' })

            const result = await authService.updateProfile(profileData)

            expect(result).toEqual({
                success: false,
                message: 'Invalid data'
            })
        })
    })

    describe('updateProfileImage', () => {
        it('should update profile image successfully', async () => {
            const imageData = 'data:image/jpeg;base64,test'

            mock.onPost('/auth/profile-image').reply(200, { message: 'Image updated' })

            const result = await authService.updateProfileImage(imageData)

            expect(result).toEqual({
                success: true,
                data: { message: 'Image updated' }
            })
        })

        it('should handle image update failure', async () => {
            const imageData = 'invalid-data'

            mock.onPost('/auth/profile-image').reply(400, { message: 'Invalid image' })

            const result = await authService.updateProfileImage(imageData)

            expect(result).toEqual({
                success: false,
                message: 'Invalid image'
            })
        })
    })

    describe('checkUsername', () => {
        it('should check username availability', async () => {
            const responseData = { available: true }

            mock.onGet('/auth/check-username?username=newuser').reply(200, responseData)

            const result = await authService.checkUsername('newuser')

            expect(result).toEqual(responseData)
        })

        it('should handle username check error', async () => {
            mock.onGet('/auth/check-username?username=test').reply(500)

            const result = await authService.checkUsername('test')

            expect(result).toEqual({
                success: false,
                message: 'Failed to check username'
            })
        })
    })

    describe('checkEmail', () => {
        it('should check email availability', async () => {
            const responseData = { available: true }

            mock.onGet('/auth/check-email?email=new@example.com').reply(200, responseData)

            const result = await authService.checkEmail('new@example.com')

            expect(result).toEqual(responseData)
        })

        it('should handle email check error', async () => {
            mock.onGet('/auth/check-email?email=test@example.com').reply(500)

            const result = await authService.checkEmail('test@example.com')

            expect(result).toEqual({
                success: false,
                message: 'Failed to check email'
            })
        })
    })

    describe('logout', () => {
        it('should remove token from localStorage', () => {
            const removeItemSpy = vi.spyOn(localStorage, 'removeItem')

            authService.logout()

            expect(removeItemSpy).toHaveBeenCalledWith('token')
        })

        it('should handle localStorage errors gracefully', () => {
            const removeItemSpy = vi.spyOn(localStorage, 'removeItem')
                .mockImplementation(() => {
                    throw new Error('localStorage error')
                })

            expect(() => authService.logout()).not.toThrow()
            expect(removeItemSpy).toHaveBeenCalledWith('token')
        })
    })
})

