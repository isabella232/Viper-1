<?php

require_once 'AbstractViperUnitTest.php';

class Viper_Tests_ViperCharMapPlugin_CharacterMapPluginUnitTest extends AbstractViperUnitTest
{


    /**
     * Test that the character map opens and you can insert symbols.
     *
     * @return void
     */
    public function testInsertingCharacter()
    {
        $this->moveToKeyword(1, 'right');
        $this->assertTrue($this->topToolbarButtonExists('charMap'), 'Character map icon should be enabled.');

        $this->clickTopToolbarButton('charMap');

        // Insert char.
        $char = $this->findImage('ViperCharMapPlugin-symbolChar-1', 'table.VCMP-table.Viper-visible td', 10);
        $this->sikuli->click($char);

        // Insert char.
        sleep(2);
        $char = $this->findImage('ViperCharMapPlugin-symbolChar-2', 'table.VCMP-table.Viper-visible td', 11);
        $this->sikuli->click($char);

        // Change to Latin char list.
        $this->sikuli->click($this->findImage('ViperCharMapPlugin-latinList', 'ul.VCMP-list li', 1));
        sleep(1);

        // Insert char.
        $char = $this->findImage('ViperCharMapPlugin-symbolChar-17', 'table.VCMP-table.Viper-visible td', 17);
        $this->sikuli->click($char);

        // Change to Mathematics char list.
        $this->sikuli->click($this->findImage('ViperCharMapPlugin-mathList', 'ul.VCMP-list li', 2));
        sleep(1);

        // Insert char.
        $char = $this->findImage('ViperCharMapPlugin-symbolChar-4', 'table.VCMP-table.Viper-visible td', 3);
        $this->sikuli->click($char);

        // Change to Mathematics char list.
        $this->sikuli->click($this->findImage('ViperCharMapPlugin-currList', 'ul.VCMP-list li', 3));
        sleep(1);

        // Insert char.
        $char = $this->findImage('ViperCharMapPlugin-symbolChar-5', 'table.VCMP-table.Viper-visible td', 10);
        $this->sikuli->click($char);

        $this->assertHTMLMatch('<p>LOREM XAX&para;§ç&times;฿ dolor</p><p>sit amet<strong>WoW</strong></p>');

    }//end testInsertingCharacter()


    /**
     * Test inserting a symbol from the character map and clicking undo.
     *
     * @return void
     */
    public function testInsertingASymbolAndClickingUndo()
    {
        $this->clickKeyword(1);
        $this->clickTopToolbarButton('charMap');

        // Insert char.
        $char = $this->findImage('ViperCharMapPlugin-symbolChar-1', 'table.VCMP-table.Viper-visible td', 10);
        $this->sikuli->click($char);

        $this->clickTopToolbarButton('historyUndo');
        $this->assertHTMLMatch('<p>LOREM %1% dolor</p><p>sit amet <strong>WoW</strong></p>');

        $this->clickTopToolbarButton('historyRedo');
        $this->assertHTMLMatch('<p>LOREM X&para;AX dolor</p><p>sit amet <strong>WoW</strong></p>');

    }//end testInsertingASymbolAndClickingUndo()


}//end class

?>
