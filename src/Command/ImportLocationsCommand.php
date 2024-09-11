<?php

namespace App\Command;

use Pimcore\Model\DataObject\Location;
use Pimcore\Model\DataObject\Data\GeoCoordinates;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Input\InputArgument;

class ImportLocationsCommand extends Command
{
    protected static $defaultName = 'app:import-locations';

    protected function configure()
    {
        $this
            ->setDescription('Imports location data from an Excel file into Pimcore.')
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
            $locationData = array_combine($headers, $row);

            // Create new Location object
            $location = new Location();
            $location->setParentId(43);
            $location->setKey($locationData['location_name']);
            $location->setLocation_name($locationData['location_name']);

            // Set GeoCoordinates
            $geoPoint = $locationData['location_geoPoint'];
            if ($this->isValidGeoPoint($geoPoint)) {
                $coordinates = $this->parseGeoPoint($geoPoint);
                $location->setLocation_geoPoint($coordinates);
            } else {
                $output->writeln('<error>Invalid geoPoint: ' . $geoPoint . '</error>');
                continue;
            }

            $location->setPublished(true);
            $location->save();

            $output->writeln('Imported location: ' . $locationData['location_name'] . ' - GeoPoint: ' . $geoPoint);
        }

        $output->writeln('Import complete.');
        return Command::SUCCESS;
    }

    private function isValidGeoPoint($geoPoint)
    {
        // Überprüfen, ob der GeoPoint im Format "latitude,longitude" vorliegt
        return preg_match('/^-?\d+\.\d+,\s*-?\d+\.\d+$/', $geoPoint);
    }

    private function parseGeoPoint($geoPoint)
    {
        list($latitude, $longitude) = explode(',', $geoPoint);
        return new GeoCoordinates(trim($latitude), trim($longitude));
    }
}
