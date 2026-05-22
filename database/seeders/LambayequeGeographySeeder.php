<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\District;
use App\Models\Province;
use Illuminate\Database\Seeder;

class LambayequeGeographySeeder extends Seeder
{
    public function run(): void
    {
        $department = Department::firstOrCreate(
            ['code' => '14'],
            ['name' => 'Lambayeque'],
        );

        $provinces = [
            ['code' => '1401', 'name' => 'Chiclayo', 'districts' => [
                ['code' => '140101', 'name' => 'Chiclayo'],
                ['code' => '140102', 'name' => 'Chongoyape'],
                ['code' => '140103', 'name' => 'Eten'],
                ['code' => '140104', 'name' => 'Eten Puerto'],
                ['code' => '140105', 'name' => 'José Leonardo Ortiz'],
                ['code' => '140106', 'name' => 'La Victoria'],
                ['code' => '140107', 'name' => 'Lagunas'],
                ['code' => '140108', 'name' => 'Monsefú'],
                ['code' => '140109', 'name' => 'Nueva Arica'],
                ['code' => '140110', 'name' => 'Oyotún'],
                ['code' => '140111', 'name' => 'Picsi'],
                ['code' => '140112', 'name' => 'Pimentel'],
                ['code' => '140113', 'name' => 'Pomalca'],
                ['code' => '140114', 'name' => 'Pucalá'],
                ['code' => '140115', 'name' => 'Reque'],
                ['code' => '140116', 'name' => 'Santa Rosa'],
                ['code' => '140117', 'name' => 'Saña'],
                ['code' => '140118', 'name' => 'Tumán'],
                ['code' => '140119', 'name' => 'Zaña'],
            ]],
            ['code' => '1402', 'name' => 'Lambayeque', 'districts' => [
                ['code' => '140201', 'name' => 'Lambayeque'],
                ['code' => '140202', 'name' => 'Chóchope'],
                ['code' => '140203', 'name' => 'Illimo'],
                ['code' => '140204', 'name' => 'Jayanca'],
                ['code' => '140205', 'name' => 'Mochumi'],
                ['code' => '140206', 'name' => 'Mórrope'],
                ['code' => '140207', 'name' => 'Motupe'],
                ['code' => '140208', 'name' => 'Olmos'],
                ['code' => '140209', 'name' => 'Pacora'],
                ['code' => '140210', 'name' => 'Salas'],
                ['code' => '140211', 'name' => 'Túcume'],
            ]],
            ['code' => '1403', 'name' => 'Ferreñafe', 'districts' => [
                ['code' => '140301', 'name' => 'Ferreñafe'],
                ['code' => '140302', 'name' => 'Cañaris'],
                ['code' => '140303', 'name' => 'Incahuasi'],
                ['code' => '140304', 'name' => 'Manuela Angulo'],
                ['code' => '140305', 'name' => 'Pitipo'],
                ['code' => '140306', 'name' => 'Pueblo Nuevo'],
            ]],
        ];

        foreach ($provinces as $provinceData) {
            $districts = $provinceData['districts'];
            unset($provinceData['districts']);

            $province = Province::firstOrCreate(
                ['code' => $provinceData['code']],
                ['name' => $provinceData['name'], 'department_id' => $department->id],
            );

            foreach ($districts as $districtData) {
                District::firstOrCreate(
                    ['code' => $districtData['code']],
                    ['name' => $districtData['name'], 'province_id' => $province->id],
                );
            }
        }

        $this->command?->info('✔ Geografía Lambayeque (INEI) sembrada.');
    }
}
