<?php

namespace App\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class AgeExtension extends AbstractExtension
{
    public function getFunctions()
    {
        return [
            new TwigFunction('calculate_age', [$this, 'calculateAge']),
        ];
    }

    public function calculateAge(\DateTime $dob): int
    {
        $now = new \DateTime();
        return $now->diff($dob)->y;
    }
}
