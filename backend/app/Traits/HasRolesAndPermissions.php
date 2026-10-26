<?php

namespace App\Traits;

use App\Models\Role;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

trait HasRolesAndPermissions
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    /**
     * Get all effective permissions granted across all assigned roles.
     *
     * @return \Illuminate\Support\Collection<string>
     */
    public function getEffectivePermissions()
    {
        return $this->roles
            ->loadMissing('permissions')
            ->flatMap(fn ($role) => $role->permissions)
            ->pluck('slug')
            ->unique()
            ->values();
    }

    /**
     * Check if the user possesses the required permission slug via any assigned role.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        return $this->getEffectivePermissions()->contains($permissionSlug);
    }

    /**
     * Check if user possesses any of the given permissions.
     */
    public function hasAnyPermission(array $permissionSlugs): bool
    {
        $permissions = $this->getEffectivePermissions();
        foreach ($permissionSlugs as $slug) {
            if ($permissions->contains($slug)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if the user has a specific role by name or slug.
     */
    public function hasRole(string $role): bool
    {
        return $this->roles->contains(fn ($r) => $r->slug === $role || $r->name === $role);
    }

    /**
     * Get array of all permissions.
     */
    public function getAllPermissions(): array
    {
        return $this->getEffectivePermissions()->all();
    }
}
