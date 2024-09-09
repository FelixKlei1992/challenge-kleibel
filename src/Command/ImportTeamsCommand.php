<?php

namespace App\Command;

use Pimcore\Model\DataObject\Team;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Input\InputArgument;

class ImportTeamsCommand extends Command
{
    protected static $defaultName = 'app:import-teams';

    protected function configure()
    {
        $this
            ->setDescription('Imports team data from an Excel file into Pimcore.')
            ->addArgument('file', InputArgument::REQUIRED, 'Path to the Excel file.');
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $filePath = $input->getArgument('file');

        if (!file_exists($filePath)) {
            $output->writeln('<error>File not found: ' . $filePath . '</error>');
            return Command::FAILURE;
        }

        $output->writeln('Importing data from ' . $filePath);

        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();
        $data = $sheet->toArray();

        $headers = array_shift($data);

        foreach ($data as $row) {
            $teamData = array_combine($headers, $row);

            $team = new Team();
            $team->setKey($teamData['team_name']);
            $team->setTeamName($teamData['team_name']);
            $team->setTeamFoundingDate(new \DateTime($teamData['team_foundingDate']));
            $team->setTeamTrainer($teamData['team_trainer']);
            
            $team->save();

            $output->writeln('Imported team: ' . $teamData['team_name']);
        }

        $output->writeln('Import complete.');
        return Command::SUCCESS;
    }
}
