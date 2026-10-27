import argon2 from 'argon2';
import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes with argon2id at the agreed parameters and never returns the password', async () => {
    const hash = await service.hash('correct horse battery');
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,p=1,t=2\$/);
    expect(hash).not.toContain('correct horse battery');
  });

  it('uses a fresh salt each time', async () => {
    expect(await service.hash('same password')).not.toBe(await service.hash('same password'));
  });

  it('verifies the right password only', async () => {
    const hash = await service.hash('correct horse battery');
    await expect(service.verify(hash, 'correct horse battery')).resolves.toBe(true);
    await expect(service.verify(hash, 'wrong password')).resolves.toBe(false);
  });

  it('treats a malformed hash as a failed check, not an error', async () => {
    await expect(service.verify('not-a-hash', 'anything')).resolves.toBe(false);
  });

  it('asks for a rehash when stored parameters are older', async () => {
    const weaker = await argon2.hash('pw', { type: argon2.argon2id, memoryCost: 8 * 1024, timeCost: 1, parallelism: 1 });
    expect(service.needsRehash(weaker)).toBe(true);
    expect(service.needsRehash(await service.hash('pw'))).toBe(false);
  });

  it('dummy verification always fails', async () => {
    await expect(service.verifyDummy('dummy-password-for-timing')).resolves.toBe(false);
  });
});
