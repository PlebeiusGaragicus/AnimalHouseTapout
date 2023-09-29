from AnimalHouseTapout.singleton import Singleton
from AnimalHouseTapout.intterra import run_intterra

import os
import threading
import asyncio
import logging
import dotenv


class Controller(Singleton):
    @classmethod
    def get_instance(cls):
        # This is the only way to access the one and only instance
        if cls._instance:
            return cls._instance
        else:
            # Instantiate the one and only Controller instance
            return cls.configure_instance()
    
    @classmethod
    def configure_instance(cls):
        """
            each time you try to re-initialize a Controller.
        """
        # Must be called before the first get_instance() call
        if cls._instance:
            raise Exception("Instance already configured")

        # Instantiate the one and only Controller instance
        controller = cls.__new__(cls)
        cls._instance = controller

        controller.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)

        dotenv.load_dotenv()

        controller.BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
        controller.AUTHORIZED_USER = os.getenv('AUTHORIZED_USER')
        controller.INTTERRA_USERNAME = os.getenv('INTTERRA_USERNAME')
        controller.INTTERRA_PASSWORD = os.getenv('INTTERRA_PASSWORD')

        if None in [controller.BOT_TOKEN, controller.AUTHORIZED_USER, controller.INTTERRA_USERNAME, controller.INTTERRA_PASSWORD]:
            controller.logger.error("Environment variables not set. Please check .env file.")
            exit(1)
            # raise Exception("Environment variables not set. Please check .env file.")

        # controller.settings = Settings.get_instance()

        return cls._instance

    def start(self) -> None:
        """
            The main loop of the application.

            * initial_destination: The first View to run. If None, the MainMenuView is
            used. Only used by the test suite.
        """
        # print("Starting the application...")
        self.logger.info("Starting the application...")

        # self.logger.info("Starting Intterra...")



        # Run Intterra
        # run_intterra()

        # TODO - make a note here explaining why and what I found in the logs
        # Instead of setInterval, using a sleep within a while loop to keep the program running and restart every 11 hours.
        # while True:
        #     time.sleep(60 * 60 * 11)  # sleep for 11 hours
        #     close_app()  # this will exit the app, and you can configure systemd to restart it




# from config import Config  # Assuming Config is a class in a file named config.py
# from telegram_bot import init_bot  # Assuming you have a file telegram_bot.py with a function init_bot
# from intterra import run_intterra  # Assuming you have a file intterra.py with a function run_intterra


# def close_app(signal_number=None, frame=None):
#     logger.info('Closing app...')
#     # Here you can add any cleanup code if needed
#     sys.exit(0)

# def check_env():
#     # Implement the environment checking logic here
#     # Return True if everything is ok, otherwise return False
#     pass
