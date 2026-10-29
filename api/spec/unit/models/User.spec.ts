import Guest from '#models/Guest.js'
import createUser from '#spec/factories/UserFactory.js'

describe('User', () => {
  context('upon creation', () => {
    it('creates a guest for this user and brings it into scope on the newly created user', async () => {
      const user = await createUser()

      expect(user.guest instanceof Guest).toBe(true)
      const guest = await user.associationQuery('guest').first()
      expect(guest instanceof Guest).toBe(true)
    })
  })

  context('upon destruction', () => {
    it('frees the email address for a new User', async () => {
      const user = await createUser({ email: 'baloo@example.com' })
      await user.destroy()

      const newUser = await createUser({ email: 'baloo@example.com' })

      expect(newUser.email).toEqual('baloo@example.com')
    })
  })
})
