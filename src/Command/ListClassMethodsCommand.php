<?php
namespace App\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Input\InputArgument;
use ReflectionClass;

class ListClassMethodsCommand extends Command
{
    protected static $defaultName = 'app:list-class-methods';

    protected function configure()
    {
        $this
            ->setDescription('Lists all methods of a specified class.')
            ->addArgument('class', InputArgument::REQUIRED, 'The fully qualified class name.');
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $className = $input->getArgument('class');

        if (!class_exists($className)) {
            $output->writeln('<error>Class not found: ' . $className . '</error>');
            return Command::FAILURE;
        }

        $output->writeln('Listing methods for class ' . $className);

        try {
            $reflection = new ReflectionClass($className);
            $methods = $reflection->getMethods();

            if (empty($methods)) {
                $output->writeln('<info>No methods found in class ' . $className . '</info>');
            } else {
                foreach ($methods as $method) {
                    $output->writeln('<info>Method: ' . $method->getName() . '</info>');
                }
            }

        } catch (\Exception $e) {
            $output->writeln('<error>Error: ' . $e->getMessage() . '</error>');
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
