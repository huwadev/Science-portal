<?php

namespace Database\Seeders;

use App\Models\Module;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $modules = [
            [
                'slug' => 'cosmic-ladder',
                'title' => 'The Cosmic Distance Ladder',
                'category' => 'Cosmology & Relativity',
                'complexity' => 'Medium',
                'concept' => 'Interactive journey through astronomical measurement milestones, from Earth circumference to Henrietta Leavitt\'s Cepheids and gravitational waves.',
                'tech' => 'Three.js • Chart.js • MathJax',
                'status' => 'build',
                'is_restricted' => false,
            ],
            [
                'slug' => 'exoplanet-lab',
                'title' => 'Exoplanet Transit Light Curve Lab',
                'category' => 'Astrophysics',
                'complexity' => 'Medium',
                'concept' => 'Plot light-dimming curves and analyze exoplanetary transits using transit photometry.',
                'tech' => 'NASA Astronify • Chart.js',
                'status' => 'build',
                'is_restricted' => false,
            ],
            [
                'slug' => 'slingshot-sandbox',
                'title' => 'Gravitational Slingshot Sandbox',
                'category' => 'Astrophysics',
                'complexity' => 'High',
                'concept' => 'Launch probes past moving planetary bodies to visualize gravitational assist maneuvers in real-time.',
                'tech' => 'Matter.js • HTML5 Canvas',
                'status' => 'build',
                'is_restricted' => true, // Restricted by default to test auth
            ],
            [
                'slug' => 'rocket-ballistics',
                'title' => 'Amateur Rocket Ballistics Engine',
                'category' => 'Aerospace Engineering',
                'complexity' => 'High',
                'concept' => 'Design rockets, solve stability metrics using Barrowman equations, and simulate flight profiles with wind-drift.',
                'tech' => 'Barrowman Equations • Chart.js',
                'status' => 'build',
                'is_restricted' => true, // Restricted by default to test auth
            ],
            [
                'slug' => 'satellite-doppler',
                'title' => 'LEO Satellite Pass & Doppler Calculator',
                'category' => 'Aerospace Engineering',
                'complexity' => 'Medium',
                'concept' => 'Predict real-time satellite visibility footprints and signal Doppler frequency shifts.',
                'tech' => 'SatNOGS • satellite.js • Leaflet.js',
                'status' => 'build',
                'is_restricted' => false,
            ],
            [
                'slug' => 'aperture-synthesis',
                'title' => 'Radio Aperture Synthesis Visualizer',
                'category' => 'Radio Science',
                'complexity' => 'Ultra',
                'concept' => 'Configure antenna arrays and observe how their baseline geometries dictate radio image resolution.',
                'tech' => 'NASA Open MCT • Canvas',
                'status' => 'build',
                'is_restricted' => true,
            ],
            [
                'slug' => 'orbital-mechanics',
                'title' => 'Multi-Phase Orbital Mechanics Simulator',
                'category' => 'Aerospace Engineering',
                'complexity' => 'High',
                'concept' => 'A gamified RK4-integrated orbit sandbox for learning gravity turns, orbital rendezvous, and transfers.',
                'tech' => 'Three.js • WebGL • RK4',
                'status' => 'build',
                'is_restricted' => true,
            ],
            [
                'slug' => 'walk-in-solar-system',
                'title' => 'Walk in the Solar System',
                'category' => 'Planetary Science',
                'complexity' => 'Medium',
                'concept' => 'Immersive 3D walk through the scaled planetary bodies of our solar system with accurate orbital math.',
                'tech' => 'Three.js • WebGL',
                'status' => 'build',
                'is_restricted' => false,
            ],
            [
                'slug' => 'lunar-explorer',
                'title' => '3D Interactive Lunar Explorer',
                'category' => 'Planetary Science',
                'complexity' => 'High',
                'concept' => 'Explore the Moon in 3D terrain, inspect historic Apollo landing sites, craters, and maria using NASA telemetry data.',
                'tech' => 'Three.js • NASA Topology',
                'status' => 'build',
                'is_restricted' => false,
            ],
            [
                'slug' => 'eclipses-transits',
                'title' => 'Eclipse & Transit Physics Lab',
                'category' => 'Planetary Science',
                'complexity' => 'High',
                'concept' => 'Explore the optical geometry, shadow structures, and orbital alignment physics that create eclipses and planetary transits.',
                'tech' => 'WebGL • Physics Engine • Light Simulation',
                'status' => 'build',
                'is_restricted' => false,
            ]
        ];

        foreach ($modules as $mod) {
            Module::updateOrCreate(
                ['slug' => $mod['slug']],
                $mod
            );
        }
    }
}
