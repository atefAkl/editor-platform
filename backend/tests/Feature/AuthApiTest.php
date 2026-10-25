<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_expected_format(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123')
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'id', 'name', 'email'
                     ],
                     'message',
                     'errors'
                 ]);
        
        $this->assertTrue($response->json('success'));
    }

    public function test_login_validation_error_format(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'not-an-email',
            'password' => '',
        ]);

        $response->assertStatus(422)
                 ->assertJsonStructure([
                     'success',
                     'data',
                     'message',
                     'errors' => ['email', 'password']
                 ]);
        
        $this->assertFalse($response->json('success'));
        $this->assertNull($response->json('data'));
    }
}
