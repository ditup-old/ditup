# ditup
online platform for real-world collaboration

dit - do it together

up - start it up

## important note
Please note that this is an abandoned alpha version. It is running at [test.ditup.org](https://test.ditup.org).

**The current active version**: [REST API](https://github.com/ditup/ditapi) + [Angular 2 App](https://github.com/ditup/ditapp-ng).


## installation
this will not work, yet, because
 * the files and folders ignored in `.gitignore` have to be created (a script for that needs to be made)
 * some browser side fonts and javascript libraries need to be installed (automatically (TODO)) (most stuff will still work without this)

1. install the repository
  * clone this repository
  * run `npm install` to install dependencies
2. install the database
  * install arangodb to your computer (current supported version is 3.0)
  * run arangodb i.e. `sudo arangod`
  * go to the folder of this repository on your computer
  * initialize the database: run `npm run init-database`
  * optionally run `npm run populate-database` to put some testing data to the database
3. run the server
  * `npm start`
4. browse the application on [http://localhost:3000](http://localhost:3000)

## testing


## development

[read about development](DEVELOPMENT.md)

[old (unfinished & abandoned) version written in php](https://github.com/ditup/ditup-php)

[old (unfinished & abandoned) version using mongodb](https://github.com/ditup/ditup-node-mongodb)

### technology
* server: nodejs
* database: [ArangoDB](https://github.com/arangodb/arangodb)

npm library [sharp](https://github.com/lovell/sharp) depends on installing [libvips](https://github.com/jcupitt/libvips) (library for processing images)

## what is the logo?
The logo is still a work in process. Fungi are a fascinating creatures. Their spores can be present underground for a long time. In good conditions their mycelia will grow. And when they meet, they can produce mushrooms (the fruit) with great speed and effectiveness. [[look here](https://upload.wikimedia.org/wikipedia/commons/d/d7/Fungi_Sexual_reproduction_cycle.png)] A mycologist would tell you more fascinating stories.

The logo wants to depict one or three mushrooms in some (simplified) form.

## License

[The MIT License](http://opensource.org/licenses/MIT)
