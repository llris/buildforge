import { describe, it, expect, vi, beforeEach } from 'vitest';

const buildsService = require('../builds.service');
const buildsRepo = require('../../repositories/builds.repository');
const prisma = require('../../utils/prisma');
const compatibilityService = require('../advisor/compatibility.service');

describe('Builds Service & Gallery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('shareBuild', () => {
    it('throws 404 if build does not exist', async () => {
      vi.spyOn(buildsRepo, 'findBuildById').mockResolvedValue(null);

      await expect(
        buildsService.shareBuild('user-1', 'invalid-id', { isPublic: true })
      ).rejects.toThrow(/not found/i);
    });

    it('throws 403 if user is not the owner', async () => {
      vi.spyOn(buildsRepo, 'findBuildById').mockResolvedValue({
        id: 'build-1',
        userId: 'other-user',
        name: 'Gaming Beast',
      });

      await expect(
        buildsService.shareBuild('user-1', 'build-1', { isPublic: true })
      ).rejects.toThrow(/own builds|permission/i);
    });

    it('creates or updates share record successfully', async () => {
      vi.spyOn(buildsRepo, 'findBuildById').mockResolvedValue({
        id: 'build-1',
        userId: 'user-1',
        name: 'Gaming Beast',
        useCase: 'GAMING',
        totalPrice: 1500,
      });

      vi.spyOn(buildsRepo, 'findShareByBuildId').mockResolvedValue(null);
      vi.spyOn(buildsRepo, 'upsertShare').mockResolvedValue({
        shareId: 'bf_abc12345',
        isPublic: true,
        viewCount: 0,
        ogTitle: 'Gaming Beast | Custom PC Build on BuildForge',
        ogDescription: 'Check out this custom PC build',
      });

      const res = await buildsService.shareBuild('user-1', 'build-1', { isPublic: true });
      expect(res.shareId).toBe('bf_abc12345');
      expect(res.shareUrl).toContain('/builds/bf_abc12345');
      expect(res.isPublic).toBe(true);
    });
  });

  describe('getSharedBuild', () => {
    it('throws 404 if shared build not found or is private', async () => {
      vi.spyOn(buildsRepo, 'findShareByShareId').mockResolvedValue(null);

      await expect(
        buildsService.getSharedBuild('non-existent')
      ).rejects.toThrow(/not found|private/i);
    });

    it('returns populated build with live compatibility and increments viewCount', async () => {
      vi.spyOn(buildsRepo, 'findShareByShareId').mockResolvedValue({
        shareId: 'bf_shared1',
        isPublic: true,
        viewCount: 42,
        build: {
          id: 'build-1',
          name: 'Silent Workstation',
          description: 'A beast for rendering',
          useCase: 'WORKSTATION',
          components: {
            cpu: 'cpu-1',
            gpu: 'gpu-1',
          },
          totalPrice: 2000,
          createdAt: new Date(),
          user: { id: 'u1', name: 'Alex' },
        },
      });

      vi.spyOn(prisma.product, 'findMany').mockResolvedValue([
        { id: 'cpu-1', name: 'AMD Ryzen 7 7800X3D', price: 400, category: { name: 'CPU', slug: 'cpu' } },
        { id: 'gpu-1', name: 'NVIDIA RTX 4080', price: 1200, category: { name: 'GPU', slug: 'gpu' } },
      ]);

      vi.spyOn(compatibilityService, 'validateBuild').mockReturnValue({
        valid: true,
        estimatedWattage: 450,
        bottleneckScore: 95,
      });

      vi.spyOn(buildsRepo, 'incrementShareViewCount').mockResolvedValue({});

      const res = await buildsService.getSharedBuild('bf_shared1');

      expect(res.shareId).toBe('bf_shared1');
      expect(res.name).toBe('Silent Workstation');
      expect(res.components.cpu.name).toBe('AMD Ryzen 7 7800X3D');
      expect(res.validation.valid).toBe(true);
    });
  });

  describe('cloneSharedBuild', () => {
    it('clones configuration into a new SavedBuild for the requesting user', async () => {
      vi.spyOn(buildsRepo, 'findShareByShareId').mockResolvedValue({
        shareId: 'bf_shared1',
        isPublic: true,
        build: {
          id: 'build-1',
          name: 'Awesome Rig',
          description: 'Top tier gaming',
          useCase: 'GAMING',
          components: { cpu: 'cpu-1', gpu: 'gpu-1' },
          totalPrice: 1600,
          buildScore: 92,
        },
      });

      vi.spyOn(buildsRepo, 'createBuild').mockResolvedValue({
        id: 'new-build-id',
        userId: 'user-2',
        name: 'Copy of Awesome Rig',
        components: { cpu: 'cpu-1', gpu: 'gpu-1' },
        totalPrice: 1600,
      });

      const res = await buildsService.cloneSharedBuild('user-2', 'bf_shared1');

      expect(res.name).toBe('Copy of Awesome Rig');
      expect(buildsRepo.createBuild).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-2',
          name: 'Copy of Awesome Rig',
          totalPrice: 1600,
        })
      );
    });
  });
});
