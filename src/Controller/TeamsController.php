<?
namespace App\Controller;

use Pimcore\Model\DataObject\AbstractObject;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class TeamsController extends AbstractController
{
    /**
     * @Route("/team_details/{id}", name="team_details")
     */
    public function view($id): Response
    {
        $team = AbstractObject::getById($id);
        if (!$team) {
            throw $this->createNotFoundException('Object not found');
        }

        return $this->render('content/team_details.html.twig', ['team' => $team]);
    }
}
