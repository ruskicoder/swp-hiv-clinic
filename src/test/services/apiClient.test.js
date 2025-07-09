import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import apiClient from '../../services/apiClient'

describe('apiClient', () => {
  let mock

  beforeEach(() => {
    mock = new MockAdapter(apiClient)
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    mock.restore()
  })

  describe('request interceptor', () => {
    it('should add authorization header when token exists', async () => {
      localStorage.setItem('token', 'test-token')
      
      // Use a different approach - check the actual request
      let requestConfig = null
      mock.onGet('/test').reply((config) => {
        requestConfig = config
        return [200, { success: true }]
      })

      await apiClient.get('/test')
      
      // Check that the authorization header was set
      expect(requestConfig.headers.Authorization).toBe('Bearer test-token')
    })

    it('should not add authorization header when token does not exist', async () => {
      let requestConfig = null
      mock.onGet('/test').reply((config) => {
        requestConfig = config
        return [200, { success: true }]
      })

      await apiClient.get('/test')
      
      expect(requestConfig.headers.Authorization).toBeUndefined()
    })
  })

  describe('response interceptor', () => {
    it('should emit dataUpdated event for non-GET requests to specific paths', async () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent')
      
      mock.onPost('/doctors/availability').reply(200, { success: true })

      await apiClient.post('/doctors/availability', {})

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dataUpdated',
          detail: { path: '/doctors/availability' }
        })
      )
    })

    it('should not emit event for GET requests', async () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent')
      
      mock.onGet('/doctors/availability').reply(200, { success: true })

      await apiClient.get('/doctors/availability')

      expect(eventSpy).not.toHaveBeenCalled()
    })

    it('should handle 401 errors by removing token and redirecting', async () => {
      localStorage.setItem('token', 'test-token')
      const removeItemSpy = vi.spyOn(localStorage, 'removeItem')
      
      // Mock window.location
      const originalLocation = window.location
      delete window.location
      window.location = { href: '', pathname: '/dashboard' }

      mock.onGet('/test').reply(401, { message: 'Unauthorized' })

      try {
        await apiClient.get('/test')
      } catch (error) {
        expect(removeItemSpy).toHaveBeenCalledWith('token')
        expect(window.location.href).toBe('/login')
      }

      // Restore original location
      window.location = originalLocation
    })

    it('should not redirect if already on login page', async () => {
      localStorage.setItem('token', 'test-token')
      
      // Mock window.location
      const originalLocation = window.location
      delete window.location
      window.location = { href: '', pathname: '/login' }
      
      mock.onGet('/test').reply(401, { message: 'Unauthorized' })

      try {
        await apiClient.get('/test')
      } catch (error) {
        expect(window.location.href).toBe('')
      }

      // Restore original location
      window.location = originalLocation
    })

    it('should handle network errors', async () => {
      mock.onGet('/test').networkError()

      await expect(apiClient.get('/test')).rejects.toThrow()
    })
  })

  describe('configuration', () => {
    it('should have correct base configuration', () => {
      expect(apiClient.defaults.baseURL).toBe('http://localhost:8080/api')
      expect(apiClient.defaults.timeout).toBe(0)
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
    })
  })
})