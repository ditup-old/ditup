# ditup
online platform for real-world collaboration

dit - do it together

up - start it up

## installation
1. install the repository
  * clone this repository
  * run `npm install` to install dependencies
2. install the database
  * install arangodb to your computer
  * run arangodb i.e. `sudo arangod`
  * go to the folder of this repository on your computer
  * initialize the database: run `npm run init-database`
  * optionally run `npm run populate-database` to put some testing data to the database
3. run the server
  * `npm start`
4. browse the application on `http://localhost:3000`

## testing


## development

[old (unfinished & abandoned) version written in php](https://github.com/ditup/ditup-php)

[old (unfinished & abandoned) version using mongodb](https://github.com/ditup/ditup-node-mongodb)

### technology
* server: nodejs
* database: arangodb

npm library [sharp](https://github.com/lovell/sharp) depends on installing [libvips](https://github.com/jcupitt/libvips) (library for processing images)

## License

[The MIT License](http://opensource.org/licenses/MIT)
