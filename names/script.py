with open('men.csv', 'r') as istr:
    with open('mennew.txt', 'w') as ostr:
        for i, line in enumerate(istr):
            # Get rid of the trailing newline (if any).
            line = line.rstrip('\n')
            line = '\'' + line.lower() + '\': \'MaleName\' , ';
            ostr.write(line)

with open('females.csv', 'r') as istr:
    with open('womennew.txt', 'w') as ostr:
        for i, line in enumerate(istr):
            # Get rid of the trailing newline (if any).
            line = line.rstrip('\n')
            line = '\'' + line.lower() + '\': \'FemaleName\' , ';
            ostr.write(line)