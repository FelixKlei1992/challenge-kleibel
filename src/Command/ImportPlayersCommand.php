<?php

namespace App\Command;

use Carbon\Carbon;
use Pimcore\Model\DataObject\Player;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Input\InputArgument;

class ImportPlayersCommand extends Command
{
    protected static $defaultName = 'app:import-players';

    protected function configure()
    {
        $this
            ->setDescription('Imports player data from an Excel file into Pimcore.')
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

        // Load Excel file
        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();

        // Convert table into array
        $data = $sheet->toArray();

        // Check for data
        if (count($data) <= 1) {
            $output->writeln('<error>No data found in the file.</error>');
            return Command::FAILURE;
        }

        // Extract table field description from the first row
        $headers = array_shift($data);
        $output->writeln('<info>Headers: ' . implode(', ', $headers) . '</info>');

        // Iterate through the rest of the lines and process data
        foreach ($data as $row) {
            $playerData = array_combine($headers, $row);

            // Create new Player object
            $player = new Player();
            $player->setParentId(18);
            $player->setKey($playerData['player_firstName'] . '-' . $playerData['player_lastName']);
            $player->setPlayer_firstName($playerData['player_firstName']);
            $player->setPlayer_lastName($playerData['player_lastName']);
            $player->setPlayer_number((int)$playerData['player_number']);

            try {
                $dateOfBirth = Carbon::createFromFormat('Y-m-d', $playerData['player_dateOfBirth']);
                $player->setPlayer_dateOfBirth($dateOfBirth);
            } catch (\Exception $e) {
                $output->writeln('<error>Invalid date of birth: ' . $playerData['player_dateOfBirth'] . '</error>');
            }

            // Set player position (check if it's a valid select option)
            $validPositions = [
                'Goalkeeper', 
                'Right Back', 
                'Center Back', 
                'Sweeper', 
                'Central Midfielder', 
                'Defensive Midfielder', 
                'Attacking Midfielder', 
                'Wide Midfielders', 
                'Striker', 
                'Second Striker', 
                'Winger']; //todo: In a real project this should list should be defined in some kind of settings section to simplify maintainability

            if (in_array($playerData['player_position'], $validPositions)) {
                $player->setPlayer_position($playerData['player_position']);
            } else {
                $output->writeln('<error>Invalid position: ' . $playerData['player_position'] . '</error>');
                continue;
            }

            $player->setPublished(true);
            $player->save();

            $output->writeln('Imported player: ' . $playerData['player_firstName'] . ' ' . $playerData['player_lastName'] . ' - Number: ' . $playerData['player_number'] . ' -Date of Birth: ' . $playerData['player_dateOfBirth']);
        }

        $output->writeln('Import complete.');
        return Command::SUCCESS;
    }
}