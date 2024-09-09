<?php

namespace App\Controller;

use Pimcore\Controller\FrontendController;
use Symfony\Bridge\Twig\Attribute\Template;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use \Pimcore\Model\DataObject;

class ContentController extends FrontendController
{
    #[Template('content/default.html.twig')]
    public function defaultAction (Request $request): array
    {
        return [];
    }
    
    public function productAction(Request $request): Response
    {
        
        $teams = new DataObject\Soccerteam\Listing();
        //$teams->setCondition("name LIKE ?", "%bernie%");
        $teams->load();
        return $this->render('content/teams.html.twig', [
            'teams' => $teams,
        ]);
    }

}
